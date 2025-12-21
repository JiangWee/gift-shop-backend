// services/verificationService.js
class VerificationService {
    constructor() {
        this.codes = new Map(); // 内存存储验证码，生产环境建议用Redis
        this.cleanupInterval = setInterval(() => this.cleanupExpired(), 60000); // 每分钟清理一次过期验证码
    }

    // 存储验证码
    storeCode(email, code) {
        const expiry = Date.now() + 10 * 60 * 1000; // 10分钟过期
        this.codes.set(email, {
            code: code,
            expiry: expiry,
            attempts: 0 // 尝试次数
        });
        
        console.log(`📧 验证码已存储: ${email} -> ${code}, 过期时间: ${new Date(expiry).toISOString()}`);
        return true;
    }

    // 验证验证码
    verifyCode(email, code) {
        const record = this.codes.get(email);
        
        if (!record) {
            console.log(`❌ 验证码记录不存在: ${email}`);
            return { valid: false, message: '验证码已过期，请重新获取' };
        }
        
        if (Date.now() > record.expiry) {
            this.codes.delete(email);
            console.log(`❌ 验证码已过期: ${email}`);
            return { valid: false, message: '验证码已过期，请重新获取' };
        }
        
        if (record.attempts >= 3) {
            this.codes.delete(email);
            console.log(`❌ 验证码尝试次数过多: ${email}`);
            return { valid: false, message: '验证码尝试次数过多，请重新获取' };
        }
        
        record.attempts++;
        
        if (record.code !== code) {
            console.log(`❌ 验证码不匹配: ${email}, 输入: ${code}, 实际: ${record.code}`);
            return { 
                valid: false, 
                message: `验证码错误，还剩${3 - record.attempts}次尝试机会`,
                attemptsLeft: 3 - record.attempts
            };
        }
        
        // 验证成功，删除记录
        this.codes.delete(email);
        console.log(`✅ 验证码验证成功: ${email}`);
        return { valid: true, message: '验证码验证成功' };
    }

    // 清理过期验证码
    cleanupExpired() {
        const now = Date.now();
        let cleaned = 0;
        
        for (const [email, record] of this.codes.entries()) {
            if (now > record.expiry) {
                this.codes.delete(email);
                cleaned++;
            }
        }
        
        if (cleaned > 0) {
            console.log(`🧹 清理了 ${cleaned} 个过期验证码`);
        }
    }

    // 获取验证码信息（用于调试）
    getCodeInfo(email) {
        return this.codes.get(email);
    }
}

module.exports = new VerificationService();