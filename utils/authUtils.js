const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

class AuthUtils {
    constructor() {
        this.secret = process.env.JWT_SECRET;
        this.accessExpires = process.env.ACCESS_TOKEN_EXPIRES || '2h';
        this.refreshExpires = process.env.REFRESH_TOKEN_EXPIRES || '7d';
    }

    // 生成Access Token
    generateAccessToken(payload) {
        return jwt.sign(payload, this.secret, { 
            expiresIn: this.accessExpires 
        });
    }

    // 生成Refresh Token
    generateRefreshToken(payload) {
        return jwt.sign(payload, this.secret, { 
            expiresIn: this.refreshExpires 
        });
    }

    // 验证Token
    verifyToken(token) {
        try {
            return jwt.verify(token, this.secret);
        } catch (error) {
            throw new Error('Token验证失败');
        }
    }

    // 密码哈希
    async hashPassword(password) {
        const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
        return await bcrypt.hash(password, saltRounds);
    }

    // 密码验证
    async comparePassword(password, hash) {
        return await bcrypt.compare(password, hash);
    }

    // 生成用户ID
    generateUserId() {
        return 'user_' + uuidv4();
    }

    // 生成订单ID
    generateOrderId() {
        return 'ORD' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();
    }
}

module.exports = new AuthUtils();