// services/paymentService.js
const alipayService = require('./alipayService');
const wechatPayService = require('./wechatPayService');
const stripeService = require('./stripeService'); // 新增
const ipService = require('./ipService'); // 新增
const orderModel = require('../models/orderModel');

class PaymentService {
    /**
     * 获取推荐的支付方式
     */
    async getRecommendedPaymentMethod(userIp) {
        try {
            const recommendation = await ipService.recommendPaymentMethod(userIp);
            return {
                success: true,
                data: recommendation
            };
        } catch (error) {
            console.error('❌ 获取推荐支付方式失败:', error);
            // 失败时默认返回 Stripe
            return {
                success: true,
                data: {
                    defaultMethod: 'stripe',
                    availableMethods: ['stripe'],
                    location: { countryCode: 'US', country: 'United States', isChina: false }
                }
            };
        }
    }

    /**
     * 智能创建支付
     * 如果 paymentMethod 为 'auto'，则根据 IP 自动选择
     */
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

            // 🔥 修改：根据订单货币计算金额
            let amount = 0;
            let description = `礼品订单：${order.product_name}`;
            let currency = 'cny';  // 默认人民币
            
            if (order.currency === 'USD' && order.exchange_rate) {
                // 如果订单货币是美元，使用显示价格
                amount = Math.round((order.display_price || order.price) * 100); // 转换为分
                description += ` (美元支付)`;
                currency = 'usd';
            } else {
                // 默认人民币
                amount = Math.round(order.price * 100); // 转换为分
                description += ` (人民币支付)`;
            }

            const paymentData = {
                orderId: orderId,
                amount: amount,
                description: description,
                ip: userIp,
                openid: openid
            };

            let result;
            let actualMethod = paymentMethod;
            
            // 如果支付方式为 'auto'，则根据 IP 自动选择
            if (paymentMethod === 'auto') {
                const recommendation = await this.getRecommendedPaymentMethod(userIp);
                actualMethod = recommendation.data.defaultMethod;
                console.log(`🌍 自动选择支付方式: ${actualMethod} (基于 IP: ${userIp})`);
            }

            switch (actualMethod) {
                case 'alipay':
                    result = await alipayService.createPayment(paymentData);
                    break;
                case 'wechat':
                    result = await wechatPayService.createPayment({
                        ...paymentData,
                        tradeType: 'NATIVE'
                    });
                    break;
                case 'stripe':
                    result = await stripeService.createPayment({
                        ...paymentData,
                        currency: currency // 可根据订单信息动态设置
                    });
                    break;
                default:
                    return { success: false, message: '不支持的支付方式' };
            }

            if (result.success) {
                // 更新订单支付信息
                await orderModel.updatePaymentInfo(orderId, {
                    paymentMethod: actualMethod, // 保存实际使用的支付方式
                    paymentAmount: amount
                });
                
                // 返回结果时带上实际使用的支付方式
                result.data.paymentMethod = actualMethod;
            }

            return result;
        } catch (error) {
            console.error('❌❌ 创建支付失败:', error);
            return { success: false, message: '支付创建失败' };
        }
    }

    /**
     * 处理支付通知
     */
    async handlePaymentNotify(paymentMethod, notifyData, request = null) {
        try {
            let verifyResult;
            switch (paymentMethod) {
                case 'alipay':
                    verifyResult = await alipayService.verifyNotify(notifyData);
                    break;
                case 'wechat':
                    verifyResult = await wechatPayService.verifyNotify(notifyData);
                    break;
                case 'stripe':
                    // Stripe 需要传递完整的 request 对象
                    verifyResult = await stripeService.verifyNotify(request);
                    break;
                default:
                    return { success: false, message: '不支持的支付方式' };
            }

            if (!verifyResult.success) {
                return verifyResult;
            }

            // 根据不同支付方式提取数据
            let orderId, tradeNo, amount, payTime;
            
            if (paymentMethod === 'stripe') {
                const event = verifyResult.data.event;
                
                // 只处理支付成功的事件
                if (event.type !== 'payment_intent.succeeded') {
                    return { success: true, message: '非支付成功事件，忽略处理' };
                }
                
                const paymentIntent = event.data.object;
                orderId = paymentIntent.metadata.orderId;
                tradeNo = paymentIntent.id;
                amount = paymentIntent.amount;
                payTime = new Date(paymentIntent.created * 1000).toISOString();
                
                // 调用 Stripe 特定的处理逻辑
                return await stripeService.handlePaymentSuccess(event);
            } else {
                // 支付宝和微信的逻辑保持不变
                orderId = verifyResult.data.orderId;
                tradeNo = verifyResult.data.tradeNo;
                amount = verifyResult.data.amount;
                payTime = verifyResult.data.payTime;
            }

            // 幂等性检查（仅对支付宝和微信，Stripe 在自身方法中处理）
            if (paymentMethod !== 'stripe') {
                const order = await orderModel.findById(orderId);
                if (!order) {
                    return { success: false, message: '订单不存在' };
                }
                if (order.status === 'paid') {
                    console.log(`ℹ️ 订单 ${orderId} 状态已是paid，无需重复处理（幂等）`);
                    return { success: true, message: '订单已支付，无需重复处理' };
                }
                if (order.status !== 'unpaid') {
                    return { success: false, message: `订单当前状态为${order.status}，不允许更新为paid` };
                }

                // 更新订单状态
                await orderModel.updateStatus(orderId, 'paid');
                await orderModel.updatePaymentSuccess(orderId, {
                    tradeNo: tradeNo,
                    payTime: payTime,
                    paymentAmount: amount
                });
                console.log(`✅ 订单 ${orderId} 状态已更新为paid (来自异步通知)`);
            }

            return { success: true, message: '支付成功处理完毕' };
        } catch (error) {
            console.error('❌❌ 处理支付通知失败:', error);
            return { success: false, message: '通知处理失败' };
        }
    }

    /**
     * 查询支付状态
     */
    async queryPaymentStatus(orderId, paymentMethod, paymentIntentId = null) {
        try {
            let queryResult;
            switch (paymentMethod) {
                case 'alipay':
                    queryResult = await alipayService.queryOrder(orderId);
                    break;
                case 'wechat':
                    queryResult = { success: false, message: '微信支付查询暂未实现' };
                    break;
                case 'stripe':
                    if (!paymentIntentId) {
                        return { success: false, message: 'Stripe 需要 paymentIntentId' };
                    }
                    queryResult = await stripeService.queryPaymentStatus(paymentIntentId);
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

    // 验证支付宝同步回调
    async verifyAlipaySyncCallback(params) {
        try {
            // 这里可以添加签名验证逻辑
            const { out_trade_no, trade_no, total_amount } = params;
            
            if (!out_trade_no) {
                return { success: false, message: '缺少订单号' };
            }
            
            // 可选：验证订单是否存在
            const order = await orderModel.findById(out_trade_no);
            if (!order) {
                return { success: false, message: '订单不存在' };
            }
            
            return { 
                success: true, 
                data: { 
                    orderId: out_trade_no,
                    tradeNo: trade_no,
                    amount: total_amount 
                }
            };
        } catch (error) {
            console.error('验证同步回调失败:', error);
            return { success: false, message: '验证失败' };
        }
    }
    
}

module.exports = new PaymentService();