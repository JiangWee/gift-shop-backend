// services/alipayService.js
const dns = require('dns');
const { AlipaySdk } = require('alipay-sdk');
const paymentConfig = require('../config/payment');
const orderModel = require('../models/orderModel'); 

class AlipayService {
    constructor() {
        try {

            // 1. 安全地获取并处理配置值
            const appId = paymentConfig.alipayConfig.appId;
            const gateway = paymentConfig.alipayConfig.gateway;
            // 🔧 关键修复：像测试脚本一样处理换行符
            const privateKey = (paymentConfig.alipayConfig.privateKey || '').replace(/\\n/g, '\n');
            const alipayPublicKey = (paymentConfig.alipayConfig.alipayPublicKey || '').replace(/\\n/g, '\n');
            
            console.log('🔧 支付宝SDK配置详情:');
            console.log('- AppId:', appId);
            console.log('- 网关:', gateway);
            console.log('- 私钥长度:', privateKey.length);
            console.log('- 公钥长度:', alipayPublicKey.length);
            
            // 2. 增强验证，失败则直接抛出错误，阻止后续初始化
            if (!gateway) {
                throw new Error('支付宝网关(ALIPAY_GATEWAY)未设置');
            }
            if (!privateKey.includes('-----BEGIN')) {
                throw new Error('私钥格式错误，缺少PEM起始标记');
            }
            if (!alipayPublicKey.includes('-----BEGIN')) {
                throw new Error('支付宝公钥格式错误，缺少PEM起始标记');
            }
            
            dns.setServers([
                '8.8.8.8',       // Google DNS
                '1.1.1.1',       // Cloudflare DNS
                '114.114.114.114' // 中国电信 DNS
            ]);
            console.log('✅ 已设置 Node.js 使用公共 DNS 服务器')

            // 3. 使用处理后的正确参数初始化SDK
            this.alipaySdk = new AlipaySdk({
                appId: appId,
                privateKey: privateKey,          // 已是处理后的正确字符串
                alipayPublicKey: alipayPublicKey, // 已是处理后的正确字符串
                gateway: gateway
            });
            
            console.log('✅ 支付宝SDK实例化成功');
        } catch (error) {
            console.error('❌ 支付宝SDK实例化失败:');
            console.error('错误信息:', error.message);
            // console.error('错误栈:', error.stack); // 可根据需要注释
            this.alipaySdk = null;
        }
        
    }

    // 🆕 添加缺失的 createPayment 方法
    async createPayment(paymentData) {
        if (!this.alipaySdk) {
            return {
                success: false,
                message: '支付宝SDK未初始化'
            };
        }

        try {
            const { orderId, amount, description, ip } = paymentData;
            
            // 转换金额格式：分转元
            const totalAmount = (amount / 100).toFixed(2);
            
            const bizContent = {
                out_trade_no: orderId,
                total_amount: totalAmount,
                subject: description || '礼品商城订单',
                body: description || '高端商务礼品',
                product_code: 'FAST_INSTANT_TRADE_PAY'
            };

            console.log('💰 创建支付宝支付订单:', bizContent);

            const result = await this.alipaySdk.pageExec('alipay.trade.page.pay', {
                method: 'GET',
                bizContent: bizContent,
                returnUrl: paymentConfig.alipayConfig.returnUrl,
                notifyUrl: paymentConfig.alipayConfig.notifyUrl
            });
            console.log('💰 paymentConfig.alipayConfig.notifyUrl:', paymentConfig.alipayConfig.notifyUrl);
            console.log('💰 paymentConfig.alipayConfig.returnUrl:', paymentConfig.alipayConfig.returnUrl);
            console.log('💰 支付宝返回的支付URL:', result);
            console.log('💰 支付URL长度:', result.length);
            console.log('💰 支付URL前200字符:', result.substring(0, 200));

            return {
                success: true,
                data: {
                    paymentUrl: result,
                    orderId: orderId,
                    amount: totalAmount
                }
            };
        } catch (error) {
            console.error('❌ 支付宝支付创建失败:', error);
            return {
                success: false,
                message: '支付宝支付创建失败',
                error: error.message
            };
        }
    }

    // 🆕 添加缺失的 verifyNotify 方法
    async verifyNotify(params) {
        if (!this.alipaySdk) {
            return { success: false, message: '支付宝SDK未初始化' };
        }

        try {
            console.log('🔍 验证支付宝通知签名:', {
                out_trade_no: params.out_trade_no,
                trade_status: params.trade_status
            });

            const verified = this.alipaySdk.checkNotifySign(params);
            if (!verified) {
                return { success: false, message: '签名验证失败' };
            }

            // 验证交易状态
            if (params.trade_status !== 'TRADE_SUCCESS' && params.trade_status !== 'TRADE_FINISHED') {
                return { 
                    success: false, 
                    message: `交易未成功，状态: ${params.trade_status}` 
                };
            }

            return {
                success: true,
                data: {
                    orderId: params.out_trade_no,
                    tradeNo: params.trade_no,
                    amount: parseFloat(params.total_amount),
                    payTime: params.gmt_payment || new Date().toISOString()
                }
            };
        } catch (error) {
            console.error('❌ 支付宝通知验证失败:', error);
            return { success: false, message: '通知验证失败' };
        }
    }

    // 🆕 添加缺失的 queryOrder 方法
    async queryOrder(orderId) {
        if (!this.alipaySdk) {
            return { success: false, message: '支付宝SDK未初始化' };
        }

        try {
            console.log('🔍 查询支付宝订单状态:', orderId);
            
            const result = await this.alipaySdk.exec('alipay.trade.query', {
                bizContent: {
                    out_trade_no: orderId
                }
            });

            console.log('📄 支付宝查询结果:', result);

            if (result.code !== '10000') {
                return { 
                    success: false, 
                    message: result.msg || '查询失败',
                    code: result.code
                };
            }

            // 🔥 关键：如果支付宝状态是成功，更新数据库
            if (result.tradeStatus === 'TRADE_SUCCESS' || result.tradeStatus === 'TRADE_FINISHED') {
                console.log(`✅ 支付宝订单 ${orderId} 状态为已支付，更新数据库...`);
                
                // 更新数据库中的订单状态
                const updateResult = await this.updateOrderPaymentStatus(orderId, {
                    tradeNo: result.tradeNo,
                    status: 'paid',
                    amount: parseFloat(result.totalAmount),
                    paymentTime: result.sendPayDate
                });
                
                if (!updateResult.success) {
                    console.error('❌ 更新数据库订单状态失败:', updateResult.message);
                }
            }

            return {
                success: true,
                data: {
                    orderId: orderId,
                    tradeNo: result.tradeNo,
                    status: this.mapAlipayStatus(result.tradeStatus),
                    amount: parseFloat(result.totalAmount),
                    payTime: result.sendPayDate
                }
            };
        } catch (error) {
            console.error('❌ 支付宝订单查询失败:', error);
            return { success: false, message: '订单查询失败' };
        }
    }

    async updateOrderPaymentStatus(orderId, paymentInfo) {
        try {
            const { tradeNo, status, amount, paymentTime } = paymentInfo;
            console.log(`🔄 更新订单 ${orderId} 支付状态:`, { tradeNo, status, amount, paymentTime });

            const updateResult = await orderModel.updatePaymentStatus(orderId, {
                status: status,                    // 订单状态
                payment_status: status,            // 支付状态
                transaction_id: tradeNo,           // ✅ 使用 transaction_id
                payment_amount: amount,            // 支付金额
                payment_time: paymentTime || new Date()  // 支付时间
            });
            
            if (updateResult) {
                console.log(`✅ 数据库订单 ${orderId} 状态已更新为 ${status}`);
                return { success: true };
            } else {
                console.warn(`⚠️ 订单 ${orderId} 可能不存在或更新失败`);
                return { success: false, message: '更新数据库失败，可能订单不存在' };
            }
        } catch (error) {
            console.error('❌ 更新订单支付状态失败:', error);
            return { success: false, message: error.message };
        }
    }
    
    // 🆕 添加映射方法
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