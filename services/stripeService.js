// services/stripeService.js
const Stripe = require('stripe');
const paymentConfig = require('../config/payment');
const orderModel = require('../models/orderModel');

class StripeService {
    constructor() {
        try {
            this.stripe = Stripe(paymentConfig.stripeConfig.secretKey);
            this.webhookSecret = paymentConfig.stripeConfig.webhookSecret;
            console.log('✅ Stripe SDK 初始化成功');
        } catch (error) {
            console.error('❌ Stripe SDK 初始化失败:', error.message);
            this.stripe = null;
        }
    }

    /**
     * 创建 Stripe 支付订单
     */
    async createPayment(paymentData) {
        if (!this.stripe) {
            return { success: false, message: 'Stripe SDK 未初始化' };
        }

        try {
            const { orderId, amount, description, currency = 'usd' } = paymentData;
            
            console.log('💰 创建 Stripe 支付订单:', { orderId, amount, currency, description });

            // Stripe 金额单位是分（或对应货币的最小单位）
            const stripeAmount = Math.round(amount); // 已经是分，直接使用

            // 创建 PaymentIntent
            const paymentIntent = await this.stripe.paymentIntents.create({
                amount: stripeAmount,
                currency: currency,
                metadata: {
                    orderId: orderId,
                    description: description
                },
                // 可配置支付方式
                automatic_payment_methods: {
                    enabled: true,
                },
                // 可设置描述
                description: description || 'Gift Shop Order',
            });

            console.log('✅ Stripe PaymentIntent 创建成功:', paymentIntent.id);

            return {
                success: true,
                data: {
                    clientSecret: paymentIntent.client_secret,
                    paymentIntentId: paymentIntent.id,
                    orderId: orderId,
                    amount: stripeAmount,
                    currency: currency
                }
            };
        } catch (error) {
            console.error('❌ Stripe 支付创建失败:', error);
            return {
                success: false,
                message: 'Stripe 支付创建失败',
                error: error.message
            };
        }
    }

    /**
     * 验证 Stripe Webhook 通知
     */
    async verifyNotify(request) {
        try {
            const sig = request.headers['stripe-signature'];
            
            if (!sig) {
                return { success: false, message: '缺少 Stripe 签名' };
            }

            // 验证签名
            const event = this.stripe.webhooks.constructEvent(
                request.body,
                sig,
                this.webhookSecret
            );

            return {
                success: true,
                data: {
                    event: event,
                    eventType: event.type
                }
            };
        } catch (error) {
            console.error('❌ Stripe Webhook 验证失败:', error.message);
            return { success: false, message: 'Webhook 验证失败' };
        }
    }

    /**
     * 处理 Stripe 支付成功事件
     */
    async handlePaymentSuccess(event) {
        try {
            const paymentIntent = event.data.object;
            const orderId = paymentIntent.metadata.orderId;
            
            if (!orderId) {
                return { success: false, message: '订单号不存在于metadata中' };
            }

            console.log(`🔄 处理 Stripe 支付成功: ${paymentIntent.id}, 订单: ${orderId}`);

            // 幂等性检查
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
                tradeNo: paymentIntent.id,
                payTime: new Date(paymentIntent.created * 1000).toISOString(),
                paymentAmount: paymentIntent.amount
            });

            console.log(`✅ 订单 ${orderId} 状态已更新为paid (来自Stripe Webhook)`);

            return { success: true, message: '支付成功处理完毕' };
        } catch (error) {
            console.error('❌ 处理 Stripe 支付成功事件失败:', error);
            return { success: false, message: '处理支付成功事件失败' };
        }
    }

    /**
     * 查询 Stripe 支付状态
     */
    async queryPaymentStatus(paymentIntentId) {
        try {
            console.log('🔍 查询 Stripe 支付状态:', paymentIntentId);
            
            const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);

            return {
                success: true,
                data: {
                    paymentIntentId: paymentIntent.id,
                    orderId: paymentIntent.metadata.orderId,
                    status: paymentIntent.status,
                    amount: paymentIntent.amount,
                    currency: paymentIntent.currency,
                    created: new Date(paymentIntent.created * 1000).toISOString()
                }
            };
        } catch (error) {
            console.error('❌ 查询 Stripe 支付状态失败:', error);
            return { success: false, message: '查询支付状态失败' };
        }
    }

    /**
     * 创建 Checkout Session（替代方案，更简单的前端集成）
     */
    async createCheckoutSession(paymentData) {
        try {
            const { orderId, amount, description, successUrl, cancelUrl, currency = 'usd' } = paymentData;
            
            const session = await this.stripe.checkout.sessions.create({
                line_items: [
                    {
                        price_data: {
                            currency: currency,
                            product_data: {
                                name: description || 'Gift Order',
                            },
                            unit_amount: Math.round(amount), // 已经是分
                        },
                        quantity: 1,
                    },
                ],
                mode: 'payment',
                success_url: successUrl + '?session_id={CHECKOUT_SESSION_ID}&order_id=' + orderId,
                cancel_url: cancelUrl + '?order_id=' + orderId,
                metadata: {
                    orderId: orderId
                },
                client_reference_id: orderId
            });

            return {
                success: true,
                data: {
                    sessionId: session.id,
                    url: session.url,
                    orderId: orderId
                }
            };
        } catch (error) {
            console.error('❌ 创建 Checkout Session 失败:', error);
            return { success: false, message: '创建支付会话失败' };
        }
    }
}

module.exports = new StripeService();