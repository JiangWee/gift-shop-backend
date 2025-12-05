const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();

// 安全中间件
app.use(helmet());
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? [
            'https://your-frontend-domain.vercel.app',
            'http://localhost:3000'
          ]
        : ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true
}));

// 速率限制
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
});
app.use(limiter);

// 解析JSON请求体
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 路由导入
const authRoutes = require('./routes/authRoutes');
const orderRoutes = require('./routes/orderRoutes');

// 路由设置
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);

// 健康检查端点
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        service: 'Gift Shop Hybrid API',
        environment: process.env.NODE_ENV || 'development',
        features: {
            authentication: 'MySQL Database',
            orders: 'Google Sheets'
        }
    });
});

// 根路径
app.get('/', (req, res) => {
    res.json({ 
        message: '🎁 欢迎使用礼品电商混合后端API',
        version: '1.0.0',
        architecture: '用户认证(MySQL) + 订单管理(Google Sheets)',
        endpoints: {
            health: '/api/health',
            auth: '/api/auth',
            orders: '/api/orders'
        }
    });
});

// 404处理
app.use('*', (req, res) => {
    res.status(404).json({ 
        success: false, 
        message: '接口不存在',
        path: req.originalUrl
    });
});

// 全局错误处理
app.use((err, req, res, next) => {
    console.error('服务器错误:', err);
    res.status(500).json({ 
        success: false, 
        message: '服务器内部错误',
        ...(process.env.NODE_ENV === 'development' && { error: err.message })
    });
});

module.exports = app;