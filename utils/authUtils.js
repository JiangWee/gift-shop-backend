// utils/authUtils.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

class AuthUtils {
    // 生成访问令牌
    static generateAccessToken(payload) {
        try {
            const secret = process.env.JWT_SECRET;
            
            if (!secret) {
                console.error('❌ JWT_SECRET 未设置，当前环境变量:');
                console.error('   JWT_SECRET:', process.env.JWT_SECRET);
                console.error('   所有环境变量:', process.env);
                throw new Error('JWT_SECRET 环境变量未设置');
            }
            
            const token = jwt.sign(
                payload,
                secret,
                {
                    expiresIn: process.env.ACCESS_TOKEN_EXPIRES || '2h',
                    issuer: process.env.JWT_ISSUER || 'gift-shop-api',
                    audience: process.env.JWT_AUDIENCE || 'gift-shop-users',
                    algorithm: 'HS256'
                }
            );
            
            return token;
        } catch (error) {
            console.error('❌ 生成访问令牌失败:', error.message);
            throw error;
        }
    }
    
    // 生成刷新令牌
    static generateRefreshToken(payload) {
        const secret = process.env.JWT_SECRET;
        
        if (!secret) {
            throw new Error('JWT_SECRET 环境变量未设置');
        }
        
        return jwt.sign(
            payload,
            secret,
            {
                expiresIn: process.env.REFRESH_TOKEN_EXPIRES || '7d',
                issuer: process.env.JWT_ISSUER || 'gift-shop-api'
            }
        );
    }
    
    // 验证令牌
    static verifyToken(token) {
        const secret = process.env.JWT_SECRET;
        
        if (!secret) {
            throw new Error('JWT_SECRET 环境变量未设置');
        }
        
        return jwt.verify(token, secret);
    }
    
    // 密码加密
    static async hashPassword(password) {
        const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
        return await bcrypt.hash(password, saltRounds);
    }
    
    // 密码验证
    static async comparePassword(password, hash) {
        return await bcrypt.compare(password, hash);
    }
    
    // 生成用户ID
    static generateUserId() {
        return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    // 生成订单ID
    static generateOrderId() {
        return 'ord_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

        // 生成6位数字验证码
    static generateVerificationCode() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }
    
    // 生成验证码令牌（用于验证流程）
    static generateVerificationToken(payload) {
        const secret = process.env.JWT_SECRET;
        return jwt.sign(
            payload,
            secret,
            {
                expiresIn: '10m', // 10分钟过期
                issuer: 'gift-shop-api'
            }
        );
    }
    
    // 验证验证码令牌
    static verifyVerificationToken(token) {
        const secret = process.env.JWT_SECRET;
        return jwt.verify(token, secret);
    }
}

module.exports = AuthUtils;