// services/wechatPayService.js
const { createHash, generateSignature } = require('../utils/cryptoUtils');
const paymentConfig = require('../config/payment');
const axios = require('axios');

class WechatPayService {
    constructor() {
        this.config = paymentConfig.wechatConfig;
    }

    // 创建微信支付订单
    async createPayment(orderData) {
        try {
            const { orderId, amount, description, ip } = orderData;
            
            const nonceStr = this.generateNonceStr();
            const timestamp = Math.floor(Date.now() / 1000).toString();
            
            const unifiedOrderParams = {
                appid: this.config.appId,
                mchid: this.config.mchId,
                description: description || '礼品商城订单',
                out_trade_no: orderId,
                notify_url: this.config.notifyUrl,
                amount: {
                    total: amount,
                    currency: 'CNY'
                },
                payer: {
                    sp_openid: orderData.openid // 如果是公众号支付需要openid
                }
            };

            // 如果是Native支付（扫码支付）
            if (orderData.tradeType === 'NATIVE') {
                unifiedOrderParams.scene_info = {
                    payer_client_ip: ip || '127.0.0.1'
                };
            }

            const result = await this.unifiedOrder(unifiedOrderParams, orderData.tradeType);
            
            if (result.success) {
                return this.buildPaymentResult(result.data, orderData.tradeType);
            }
            
            return result;
        } catch (error) {
            console.error('❌❌ 微信支付创建失败:', error);
            return {
                success: false,
                message: '微信支付创建失败',
                error: error.message
            };
        }
    }

    // 统一下单接口
    async unifiedOrder(params, tradeType = 'NATIVE') {
        try {
            const url = 'https://api.mch.weixin.qq.com/v3/pay/transactions/native';
            
            const response = await axios.post(url, params, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                auth: {
                    username: this.config.mchId,
                    password: this.getMerchantSign(params)
                }
            });

            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            console.error('❌❌ 微信统一下单失败:', error.response?.data || error.message);
            return {
                success: false,
                message: '统一下单失败',
                error: error.response?.data || error.message
            };
        }
    }

    // 构建支付结果
    buildPaymentResult(paymentData, tradeType) {
        if (tradeType === 'NATIVE') {
            return {
                success: true,
                data: {
                    codeUrl: paymentData.code_url,
                    orderId: paymentData.out_trade_no,
                    amount: paymentData.amount.total
                }
            };
        }
        
        // 其他支付方式（JSAPI、APP等）
        return {
            success: true,
            data: paymentData
        };
    }

    // 验证微信支付通知
    async verifyNotify(notification) {
        try {
            // 验证签名
            const sign = notification.signature;
            const timestamp = notification.timestamp;
            const nonce = notification.nonce;
            const body = notification.body;

            const verified = this.verifySignature(body, sign, timestamp, nonce);
            if (!verified) {
                return { success: false, message: '签名验证失败' };
            }

            const resource = notification.resource;
            const decryptedData = this.decryptResource(resource);

            if (decryptedData.trade_state !== 'SUCCESS') {
                return { success: false, message: '交易未成功' };
            }

            return {
                success: true,
                data: {
                    orderId: decryptedData.out_trade_no,
                    transactionId: decryptedData.transaction_id,
                    amount: decryptedData.amount.total,
                    payTime: decryptedData.success_time
                }
            };
        } catch (error) {
            console.error('❌❌ 微信支付通知验证失败:', error);
            return { success: false, message: '通知验证失败' };
        }
    }

    // 生成随机字符串
    generateNonceStr(length = 32) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    // 生成商户签名
    getMerchantSign(params) {
        // 微信支付V3签名算法实现
        const message = this.buildSignMessage(params);
        return createHash('sha256').update(message).digest('hex');
    }

    // 验证签名
    verifySignature(body, sign, timestamp, nonce) {
        const message = `${timestamp}\n${nonce}\n${body}\n`;
        const expectedSign = createHash('sha256').update(message).digest('hex');
        return expectedSign === sign;
    }

    // 解密资源数据
    decryptResource(resource) {
        // 实现资源解密逻辑
        try {
            return JSON.parse(Buffer.from(resource.ciphertext, 'base64').toString());
        } catch (error) {
            throw new Error('资源解密失败');
        }
    }
}

module.exports = new WechatPayService();