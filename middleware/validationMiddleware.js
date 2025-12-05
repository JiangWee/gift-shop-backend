const { body, validationResult } = require('express-validator');

// 注册验证规则
const validateRegistration = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('请输入有效的邮箱地址'),
    
    body('phone')
        .matches(/^1[3-9]\d{9}$/)
        .withMessage('请输入有效的手机号码'),
    
    body('password')
        .isLength({ min: 6 })
        .withMessage('密码长度至少6位')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('密码必须包含大小写字母和数字'),
    
    body('confirm')
        .custom((value, { req }) => value === req.body.password)
        .withMessage('两次输入的密码不一致')
];

// 登录验证规则
const validateLogin = [
    body('identifier')
        .notEmpty()
        .withMessage('账号不能为空'),
    
    body('password')
        .notEmpty()
        .withMessage('密码不能为空')
];

// 订单验证规则
const validateOrder = [
    body('product_id')
        .notEmpty()
        .withMessage('产品ID不能为空'),
    
    body('product_name')
        .notEmpty()
        .withMessage('产品名称不能为空'),
    
    body('price')
        .isFloat({ min: 0 })
        .withMessage('价格必须大于0'),
    
    body('buyer_info.name')
        .notEmpty()
        .withMessage('购买者姓名不能为空'),
    
    body('recipient_info.name')
        .notEmpty()
        .withMessage('收件人姓名不能为空')
];

// 处理验证结果
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: '数据验证失败',
            errors: errors.array()
        });
    }
    next();
};

module.exports = {
    validateRegistration,
    validateLogin,
    validateOrder,
    handleValidationErrors
};