const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const giftBagController = require('../controllers/giftBagController');

// 验证规则
const validateInquiry = [
    body('name')
        .notEmpty()
        .withMessage('Name is required')
        .isLength({ min: 2, max: 100 })
        .withMessage('Name must be 2-100 characters'),
    
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please enter a valid email'),
    
    body('message')
        .notEmpty()
        .withMessage('Message is required')
        .isLength({ min: 5, max: 2000 })
        .withMessage('Message must be 5-2000 characters'),
    
    body('phone')
        .optional({ nullable: true })
        .matches(/^[\d\s\-+()]{7,20}$/)
        .withMessage('Please enter a valid phone number'),
    
    body('company')
        .optional()
        .isLength({ max: 200 })
        .withMessage('Company name too long'),
    
    body('quantity')
        .optional()
        .isLength({ max: 50 })
        .withMessage('Quantity description too long')
];

// 处理验证错误
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: errors.array()[0].msg,
            errors: errors.array()
        });
    }
    next();
};

// POST /api/giftbag/inquiry - B2B询盘接口
router.post('/inquiry', validateInquiry, handleValidationErrors, giftBagController.sendInquiry);

// GET /api/giftbag/test - 测试端点
router.get('/test', (req, res) => {
    res.json({ 
        message: 'GiftBag B2B API is working',
        endpoint: '/api/giftbag/inquiry',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;
