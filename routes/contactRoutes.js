const express = require('express');
const contactController = require('../controllers/contactController');
const { 
    validateContactForm,
    handleValidationErrors 
} = require('../middleware/validationMiddleware');

const router = express.Router();

// 联系表单提交 - 发送邮件
router.post('/send', 
    validateContactForm, 
    handleValidationErrors, 
    contactController.sendContactMessage
);

// 测试端点
router.get('/test', (req, res) => {
    res.json({ 
        message: '联系表单路由工作正常',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

module.exports = router;
