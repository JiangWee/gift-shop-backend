const userModel = require('../models/userModel');
const authUtils = require('../utils/authUtils');

class AuthController {
    // 用户注册
    async register(req, res) {
        try {
            const { email, phone, password, confirm } = req.body;
            
            // 检查用户是否已存在
            const existingUsers = await userModel.checkExistingUser(email, phone);
            if (existingUsers.length > 0) {
                const existingEmail = existingUsers.find(u => u.email === email);
                const existingPhone = existingUsers.find(u => u.phone === phone);
                
                if (existingEmail) {
                    return res.status(409).json({
                        success: false,
                        message: '该邮箱已被注册'
                    });
                }
                if (existingPhone) {
                    return res.status(409).json({
                        success: false,
                        message: '该手机号已被注册'
                    });
                }
            }

            // 创建用户
            const userId = authUtils.generateUserId();
            const passwordHash = await authUtils.hashPassword(password);
            
            await userModel.create({
                id: userId,
                email,
                phone,
                password_hash: passwordHash,
                username: email.split('@')[0]
            });

            // 生成Token
            const accessToken = authUtils.generateAccessToken({ 
                userId: userId, 
                email: email 
            });
            
            const refreshToken = authUtils.generateRefreshToken({ 
                userId: userId 
            });

            // 更新最后登录时间
            await userModel.updateLastLogin(userId);

            res.status(201).json({
                success: true,
                message: '注册成功',
                data: {
                    accessToken,
                    refreshToken,
                    user: {
                        id: userId,
                        email,
                        username: email.split('@')[0]
                    }
                }
            });

        } catch (error) {
            console.error('注册错误:', error);
            res.status(500).json({
                success: false,
                message: '注册失败，请稍后重试'
            });
        }
    }

    // 用户登录
    async login(req, res) {
        try {
            const { identifier, password } = req.body;

            // 根据邮箱或手机号查找用户
            let user = await userModel.findByEmail(