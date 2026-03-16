// services/ipService.js
const axios = require('axios');

class IpService {
    constructor() {
        // 免费 IP 查询服务（有频率限制，生产环境建议使用付费服务）
        this.ipApiUrl = 'http://ip-api.com/json/';
    }

    /**
     * 根据 IP 获取地理位置信息
     */
    async getLocationByIp(ip) {
        try {
            // 如果是本地 IP，默认返回中国
            if (this.isLocalIp(ip)) {
                return { countryCode: 'CN', country: 'China', isChina: true };
            }

            const response = await axios.get(`${this.ipApiUrl}${ip}?fields=status,country,countryCode,query`);
            
            if (response.data.status === 'success') {
                const isChina = response.data.countryCode === 'CN';
                return {
                    countryCode: response.data.countryCode,
                    country: response.data.country,
                    isChina: isChina,
                    ip: response.data.query
                };
            }
            
            // 如果查询失败，默认返回非中国（保守策略）
            return { countryCode: 'US', country: 'United States', isChina: false };
        } catch (error) {
            console.error('❌ IP 地理位置查询失败:', error.message);
            // 查询失败时，默认返回非中国
            return { countryCode: 'US', country: 'United States', isChina: false };
        }
    }

    /**
     * 判断是否为本地/内网 IP
     */
    isLocalIp(ip) {
        if (!ip) return true;
        
        // 处理 IPv4
        if (ip.includes('127.0.0.1') || 
            ip.includes('192.168.') || 
            ip.includes('10.') || 
            ip.includes('172.16.') ||
            ip.includes('172.17.') ||
            ip.includes('172.18.') ||
            ip.includes('172.19.') ||
            ip.includes('172.20.') ||
            ip.includes('172.21.') ||
            ip.includes('172.22.') ||
            ip.includes('172.23.') ||
            ip.includes('172.24.') ||
            ip.includes('172.25.') ||
            ip.includes('172.26.') ||
            ip.includes('172.27.') ||
            ip.includes('172.28.') ||
            ip.includes('172.29.') ||
            ip.includes('172.30.') ||
            ip.includes('172.31.')) {
            return true;
        }
        
        // 处理 IPv6 本地地址
        if (ip.includes('::1') || ip.includes('fc00:') || ip.includes('fe80:')) {
            return true;
        }
        
        return false;
    }

    /**
     * 智能推荐支付方式
     * 返回: { defaultMethod: 'alipay'|'stripe', availableMethods: ['alipay', 'wechat', 'stripe'] }
     */
    async recommendPaymentMethod(ip) {
        const location = await this.getLocationByIp(ip);
        
        if (location.isChina) {
            return {
                defaultMethod: 'alipay',
                availableMethods: ['alipay', 'wechat'],
                location: location
            };
        } else {
            return {
                defaultMethod: 'stripe',
                availableMethods: ['stripe'],
                location: location
            };
        }
    }
}

module.exports = new IpService();