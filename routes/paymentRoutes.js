// routes/paymentRoutes.js
const express = require('express');
const paymentController = require('../controllers/paymentController');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

// 需要认证的路由
router.post('/create', authenticateToken, paymentController.createPayment);
router.get('/status', authenticateToken, paymentController.queryPaymentStatus);
router.get('/success', paymentController.paymentSuccess);

// 支付通知路由（不需要认证）
router.post('/alipay/notify', express.urlencoded({ extended: false }), paymentController.alipayNotify);
router.post('/wechat/notify', express.json(), paymentController.wechatNotify);

module.exports = router;