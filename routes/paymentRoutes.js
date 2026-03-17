// routes/paymentRoutes.js
const express = require('express');
const paymentController = require('../controllers/paymentController');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

// 需要认证的路由
router.post('/create', authenticateToken, paymentController.createPayment);
router.get('/status', authenticateToken, paymentController.queryPaymentStatus);
router.get('/success', paymentController.paymentSuccess); // 同步回调
router.get('/recommend', authenticateToken, paymentController.getRecommendedPayment); // 新增

router.get('/stripe/config', paymentController.getStripeConfig); // 不需要认证，前端初始化需要

// 支付通知路由（不需要认证）
router.post('/alipay/notify', express.urlencoded({ extended: false }), paymentController.alipayNotify); // 异步通知
router.post('/wechat/notify', express.json(), paymentController.wechatNotify);


module.exports = router;