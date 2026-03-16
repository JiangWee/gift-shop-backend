// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');

// 🔥 关键修复1：引入并初始化 Stripe
const Stripe = require('stripe');
// 初始化 Stripe 实例，确保在引用前完成
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

const { testConnection } = require('./config/database');
const resendEmailService = require('./services/resendEmailService');

const app = express();

// ==================== 1. 最简化的健康检查（放在最前面） ====================
// 这个路由必须能独立工作，不依赖任何其他服务
app.get('/api/health', (req, res) => {
  console.log(`[${new Date().toISOString()}] ✅ 健康检查通过`);
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'GiftBuyBuy Backend API',
    version: '1.0'
  });
});

// ==================== 2. 基础中间件配置 ====================
const allowedOrigins = [
  'https://www.giftbuybuy.cn',
  'https://www.giftbuybuy.com', 
  'https://giftbuybuy.vercel.app',
  'http://localhost:3000'
];
app.use(cors({ origin: allowedOrigins, credentials: true }));

// ==================== 3. Stripe Webhook 路由（使用原始 body） ====================
// 必须在 express.json() 之前
app.post('/api/payment/stripe/webhook', 
  express.raw({ type: 'application/json' }),
  (req, res) => {
    console.log('📩 收到 Stripe Webhook 请求');
    
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    // 基础验证
    if (!sig) {
      console.error('❌ 缺少 Stripe-Signature 请求头');
      return res.status(400).json({ error: 'Missing signature header' });
    }
    
    if (!webhookSecret) {
      console.error('❌ STRIPE_WEBHOOK_SECRET 环境变量未配置');
      return res.status(500).json({ error: 'Server configuration error' });
    }
    
    let event;
    try {
      // 🔥 关键修复2：使用已初始化的 stripe 实例
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
      console.log(`✅ Webhook 验证成功: ${event.type}`);
    } catch (err) {
      console.error('❌ Webhook 签名验证失败:', err.message);
      return res.status(400).json({ error: `Webhook Error: ${err.message}` });
    }
    
    // 返回成功响应（实际业务处理应在后续队列或异步进行）
    res.json({ received: true, eventType: event.type });
  }
);

// ==================== 4. 标准中间件（用于其他路由） ====================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==================== 5. 异步初始化函数 ====================
const initializeApp = async () => {
  console.log('🔍 开始初始化应用...');
  
  try {
    // 测试数据库连接
    const dbConnected = await testConnection();
    if (!dbConnected) {
      throw new Error('数据库连接失败');
    }
    console.log('✅ 数据库连接成功');
    
    // 初始化邮件服务
    await resendEmailService.initialize();
    console.log('✅ 邮件服务初始化完成');
    
    return true;
  } catch (error) {
    console.error('❌ 应用初始化失败:', error.message);
    // 不要立即退出，让健康检查能反映问题
    return false;
  }
};

// ==================== 6. 其他业务路由 ====================
// 这些路由依赖于数据库等服务的初始化
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/payment', require('./routes/paymentRoutes'));

// ==================== 7. 全局错误处理 ====================
app.use((error, req, res, next) => {
  console.error('❌ 未捕获的服务器错误:', error);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong!' : error.message
  });
});

// 404 处理
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// ==================== 8. 启动服务器 ====================
const startServer = async () => {
  const PORT = process.env.PORT || 3000;
  
  // 尝试初始化，但不阻塞启动
  const initSuccess = await initializeApp();
  
  if (!initSuccess) {
    console.warn('⚠️  应用初始化有部分失败，但服务器继续启动以提供健康检查');
  }
  
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 服务器启动成功，监听端口: ${PORT}`);
    console.log(`📅 启动时间: ${new Date().toISOString()}`);
    console.log(`🌍 健康检查: http://0.0.0.0:${PORT}/api/health`);
    console.log(`💳 Stripe Webhook: POST http://0.0.0.0:${PORT}/api/payment/stripe/webhook`);
    console.log(`⚙️  环境: ${process.env.NODE_ENV || 'development'}`);
  });
};

// 启动服务器
startServer().catch(error => {
  console.error('❌❌ 服务器启动失败:', error);
  process.exit(1);
});