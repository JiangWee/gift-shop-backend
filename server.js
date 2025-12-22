// server.js
require('dotenv').config();


const { testConnection } = require('./config/database');
const resendEmailService = require('./utils/resendEmailService');

// 在启动服务器前测试数据库连接
const initializeApp = async () => {
    console.log('🔍 开始初始化应用...');
    
    // 测试数据库连接
    const dbConnected = await testConnection();
    if (!dbConnected) {
        console.error('❌❌ 应用启动失败：数据库连接异常');
        process.exit(1);
    }
    
    console.log('✅ 数据库连接测试完成，启动服务器...');
    
    // 初始化邮件服务
    await resendEmailService.initialize();
};

initializeApp();


const express = require('express');
const app = express();

const cors = require('cors');

// 允许所有来源（开发环境）
// app.use(cors());

// 生产环境建议指定允许的来源
const allowedOrigins = ['http://localhost:8000','http://127.0.0.1:8000', 'https://giftbuybuy.vercel.app'];
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// 在 server.js 中添加（测试完成后移除）
app.get('/test-email', async (req, res) => {
    try {
        await emailService.sendEmail(
            '410294170@qq.com',
            '测试邮件',
            '<h1>这是一封测试邮件</h1><p>如果收到，说明配置正确。</p>'
        );
        res.json({ success: true, message: '测试邮件发送成功' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 中间件配置
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 路由引入
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));

// 健康检查端点（重要！）
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 错误处理中间件
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong!' : error.message
  });
});

// 使用环境变量端口，Railway会自动注入
const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 礼品电商混合后端服务器启动成功`);
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🏗️  架构: 用户认证 + 订单管理(MySQL)`);
  console.log(`⏰ 启动时间: ${new Date().toISOString()}`);
});

