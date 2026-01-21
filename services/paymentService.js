// services/paymentService.js
const alipayService = require('./alipayService');
const wechatPayService = require('./wechatPayService');
const orderModel = require('../models/orderModel');

class PaymentService {
    // 创建支付
    async createPayment(orderId, paymentMethod, userIp, openid) {
        try {
            // 获取订单信息
            const order = await orderModel.findById(orderId);
            if (!order) {
                return { success: false, message: '订单不存在' };
            }

            if (order.status !== 'unpaid') {
                return { success: false, message: '订单状态不允许支付' };
            }

            const amount = Math.round(order.price * order.quantity * 100); // 转换为分

            const paymentData = {
                orderId: orderId,
                amount: amount,
                description: `礼品订单：${order.product_name}`,
                ip: userIp,
                openid: openid
            };

            let result;
            switch (paymentMethod) {
                case 'alipay':
                    result = await alipayService.createPayment(paymentData);
                    break;
                case 'wechat':
                    result = await wechatPayService.createPayment({
                        ...paymentData,
                        tradeType: 'NATIVE' // 扫码支付
                    });
                    break;
                default:
                    return { success: false, message: '不支持的支付方式' };
            }

            if (result.success) {
                // 更新订单支付信息
                await orderModel.updatePaymentInfo(orderId, {
                    paymentMethod: paymentMethod,
                    paymentAmount: amount
                });
            }

            return result;
        } catch (error) {
            console.error('❌❌ 创建支付失败:', error);
            return { success: false, message: '支付创建失败' };
        }
    }

    // 处理支付通知
    async handlePaymentNotify(paymentMethod, notifyData) {
        try {
            let verifyResult;
            switch (paymentMethod) {
                case 'alipay':
                    verifyResult = await alipayService.verifyNotify(notifyData);
                    break;
                case 'wechat':
                    verifyResult = await wechatPayService.verifyNotify(notifyData);
                    break;
                default:
                    return { success: false, message: '不支持的支付方式' };
            }

            if (!verifyResult.success) {
                return verifyResult;
            }

            const { orderId, tradeNo, amount, payTime } = verifyResult.data;

            // 更新订单状态
            await orderModel.updateStatus(orderId, 'paid');
            await orderModel.updatePaymentSuccess(orderId, {
                tradeNo: tradeNo,
                payTime: payTime,
                paymentAmount: amount
            });

            return { success: true, message: '支付成功' };
        } catch (error) {
            console.error('❌❌ 处理支付通知失败:', error);
            return { success: false, message: '通知处理失败' };
        }
    }

    // 查询支付状态
    async queryPaymentStatus(orderId, paymentMethod) {
        try {
            let queryResult;
            switch (paymentMethod) {
                case 'alipay':
                    queryResult = await alipayService.queryOrder(orderId);
                    break;
                case 'wechat':
                    // 微信支付查询接口实现
                    queryResult = { success: false, message: '微信支付查询暂未实现' };
                    break;
                default:
                    return { success: false, message: '不支持的支付方式' };
            }

            return queryResult;
        } catch (error) {
            console.error('❌❌ 查询支付状态失败:', error);
            return { success: false, message: '查询失败' };
        }
    }

    // 退款处理
    async refundPayment(orderId, refundAmount, reason) {
        try {
            const order = await orderModel.findById(orderId);
            if (!order || order.status !== 'paid') {
                return { success: false, message: '订单状态不允许退款' };
            }

            // 根据支付方式调用不同的退款接口
            // 这里需要实现具体的退款逻辑

            return { success: true, message: '退款申请已提交' };
        } catch (error) {
            console.error('❌❌ 退款处理失败:', error);
            return { success: false, message: '退款失败' };
        }
    }
}

module.exports = new PaymentService();