const express = require('express');
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { 
    validateRegistration, 
    validateLogin,
    validateForgotPassword,
    validateVerifyCode,
    validateResetPassword,
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

// 忘记密码流程
router.post('/forgot-password/send-code',
    validateForgotPassword,
    handleValidationErrors,
    authController.sendVerificationCode
);

router.post('/forgot-password/verify-code',
    validateVerifyCode,
    handleValidationErrors,
    authController.verifyCode
);

router.post('/forgot-password/reset',
    validateResetPassword,
    handleValidationErrors,
    authController.resetPassword
);

module.exports = router;