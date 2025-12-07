const express = require('express');
const orderController = require('../controllers/orderController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { 
    validateOrder, 
    handleValidationErrors 
} = require('../middleware/validationMiddleware');

const router = express.Router();

// 所有订单路由都需要认证
router.use(authenticateToken);

// 创建新订单
router.post('/', 
    validateOrder, 
    handleValidationErrors, 
    orderController.createOrder
);

// 获取用户订单列表
router.get('/', orderController.getOrders);

// 获取订单详情
router.get('/:id', orderController.getOrderById);

// 更新订单状态
router.patch('/:id/status', orderController.updateOrderStatus);

// 获取订单统计
router.get('/stats/summary', orderController.getOrderStats);

// 测试端点
router.get('/test/auth', (req, res) => {
    res.json({ 
        message: '订单路由认证正常',
        user: req.user,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

module.exports = router;