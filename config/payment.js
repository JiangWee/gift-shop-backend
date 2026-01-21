// config/payment.js
class PaymentConfig {
    constructor() {
        this.alipayConfig = {
            appId: process.env.ALIPAY_APP_ID,
            privateKey: process.env.ALIPAY_PRIVATE_KEY,
            alipayPublicKey: process.env.ALIPAY_PUBLIC_KEY,
            gateway: process.env.NODE_ENV === 'production' 
                ? 'https://openapi.alipay.com/gateway.do'
                : 'https://openapi.alipaydev.com/gateway.do',
            notifyUrl: process.env.ALIPAY_NOTIFY_URL || `${process.env.BASE_URL}/api/payment/alipay/notify`,
            returnUrl: process.env.ALIPAY_RETURN_URL || `${process.env.BASE_URL}/payment/success`
        };

        this.wechatConfig = {
            appId: process.env.WECHAT_APP_ID,
            mchId: process.env.WECHAT_MCH_ID,
            key: process.env.WECHAT_KEY,
            notifyUrl: process.env.WECHAT_NOTIFY_URL || `${process.env.BASE_URL}/api/payment/wechat/notify`
        };
    }

    validateConfig() {
        const errors = [];
        
        // 支付宝配置验证
        if (!this.alipayConfig.appId) errors.push('ALIPAY_APP_ID 未配置');
        if (!this.alipayConfig.privateKey) errors.push('ALIPAY_PRIVATE_KEY 未配置');
        
        // 微信支付配置验证
        if (!this.wechatConfig.appId) errors.push('WECHAT_APP_ID 未配置');
        if (!this.wechatConfig.mchId) errors.push('WECHAT_MCH_ID 未配置');
        
        if (errors.length > 0) {
            console.error('❌❌ 支付配置错误:', errors);
            return false;
        }
        
        console.log('✅✅ 支付配置验证通过');
        return true;
    }
}

module.exports = new PaymentConfig();