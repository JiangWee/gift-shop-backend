// services/alipayService.js
const AlipaySdk = require('alipay-sdk').default;
const paymentConfig = require('../config/payment');

class AlipayService {
    constructor() {
        this.alipaySdk = new AlipaySdk({
            appId: paymentConfig.alipayConfig.appId,
            privateKey: paymentConfig.alipayConfig.privateKey,
            alipayPublicKey: paymentConfig.alipayConfig.alipayPublicKey,
            gateway: paymentConfig.alipayConfig.gateway
        });
    }

    // 创建支付宝支付订单
    async createPayment(orderData) {
        try {
            const { orderId, amount, subject, body } = orderData;
            
            const bizContent = {
                out_trade_no: orderId,
                total_amount: amount.toFixed(2),
                subject: subject || '礼品商城订单',
                body: body || '高端商务礼品',
                product_code: 'FAST_INSTANT_TRADE_PAY'
            };

            const result = await this.alipaySdk.pageExec('alipay.trade.page.pay', {
                method: 'GET',
                bizContent: bizContent,
                returnUrl: paymentConfig.alipayConfig.returnUrl,
                notifyUrl: paymentConfig.alipayConfig.notifyUrl
            });

            return {
                success: true,
                data: {
                    paymentUrl: result,
                    orderId: orderId,
                    amount: amount
                }
            };
        } catch (error) {
            console.error('❌❌ 支付宝支付创建失败:', error);
            return {
                success: false,
                message: '支付宝支付创建失败',
                error: error.message
            };
        }
    }

    // 验证支付宝异步通知
    async verifyNotify(params) {
        try {
            const verified = this.alipaySdk.checkNotifySign(params);
            if (!verified) {
                return { success: false, message: '签名验证失败' };
            }

            // 验证交易状态
            if (params.trade_status !== 'TRADE_SUCCESS') {
                return { success: false, message: '交易未成功' };
            }

            return {
                success: true,
                data: {
                    orderId: params.out_trade_no,
                    tradeNo: params.trade_no,
                    amount: parseFloat(params.total_amount),
                    payTime: params.gmt_payment
                }
            };
        } catch (error) {
            console.error('❌❌ 支付宝通知验证失败:', error);
            return { success: false, message: '通知验证失败' };
        }
    }

    // 查询订单状态
    async queryOrder(orderId) {
        try {
            const result = await this.alipaySdk.exec('alipay.trade.query', {
                bizContent: {
                    out_trade_no: orderId
                }
            });

            if (result.code !== '10000') {
                return { success: false, message: result.msg };
            }

            return {
                success: true,
                data: {
                    orderId: orderId,
                    tradeNo: result.trade_no,
                    status: this.mapAlipayStatus(result.trade_status),
                    amount: parseFloat(result.total_amount),
                    payTime: result.send_pay_date
                }
            };
        } catch (error) {
            console.error('❌❌ 支付宝订单查询失败:', error);
            return { success: false, message: '订单查询失败' };
        }
    }

    mapAlipayStatus(tradeStatus) {
        const statusMap = {
            'WAIT_BUYER_PAY': 'pending',
            'TRADE_CLOSED': 'cancelled',
            'TRADE_SUCCESS': 'paid',
            'TRADE_FINISHED': 'completed'
        };
        return statusMap[tradeStatus] || 'unknown';
    }
}

module.exports = new AlipayService();