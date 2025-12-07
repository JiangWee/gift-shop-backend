const express = require('express');
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { 
    validateRegistration, 
    validateLogin, 
    handleValidationErrors 
} = require('../middleware/validationMiddleware');

const router = express.Router();

// 用户注册
router.post('/register', 
    validateRegistration, 
    handleValidationErrors, 
    authController.register
);

// 用户登录
router.post('/login', 
    validateLogin, 
    handleValidationErrors, 
    authController.login
);

// 刷新访问令牌
router.post('/refresh', authController.refreshToken);

// 用户退出
router.post('/logout', authenticateToken, authController.logout);

// 获取当前用户信息
router.get('/me', authenticateToken, authController.getMe);

// 测试端点
router.get('/test', (req, res) => {
    res.json({ 
        message: '认证路由工作正常',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

module.exports = router;