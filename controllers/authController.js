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
            let user = await userModel.findByEmail(identifier);
            if (!user) {
                user = await userModel.findByPhone(identifier);
            }

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: '账号或密码错误'
                });
            }

            // 验证密码
            const isPasswordValid = await authUtils.comparePassword(password, user.password_hash);
            if (!isPasswordValid) {
                return res.status(401).json({
                    success: false,
                    message: '账号或密码错误'
                });
            }

            // 生成Token
            const accessToken = authUtils.generateAccessToken({ 
                userId: user.id, 
                email: user.email 
            });
            
            const refreshToken = authUtils.generateRefreshToken({ 
                userId: user.id 
            });

            // 更新最后登录时间
            await userModel.updateLastLogin(user.id);

            res.json({
                success: true,
                message: '登录成功',
                data: {
                    accessToken,
                    refreshToken,
                    user: {
                        id: user.id,
                        email: user.email,
                        username: user.username,
                        phone: user.phone
                    }
                }
            });

        } catch (error) {
            console.error('登录错误:', error);
            res.status(500).json({
                success: false,
                message: '登录失败，请稍后重试'
            });
        }
    }

    // 刷新访问令牌
    async refreshToken(req, res) {
        try {
            const { refreshToken } = req.body;

            if (!refreshToken) {
                return res.status(400).json({
                    success: false,
                    message: '刷新令牌必填'
                });
            }

            // 验证刷新令牌
            let decoded;
            try {
                decoded = authUtils.verifyToken(refreshToken);
            } catch (error) {
                return res.status(403).json({
                    success: false,
                    message: '刷新令牌无效或已过期'
                });
            }

            // 获取用户信息
            const user = await userModel.findById(decoded.userId);
            if (!user) {
                return res.status(403).json({
                    success: false,
                    message: '用户不存在'
                });
            }

            // 生成新的访问令牌
            const newAccessToken = authUtils.generateAccessToken({ 
                userId: user.id, 
                email: user.email 
            });

            res.json({
                success: true,
                message: '令牌刷新成功',
                data: {
                    accessToken: newAccessToken
                }
            });

        } catch (error) {
            console.error('刷新令牌错误:', error);
            res.status(500).json({
                success: false,
                message: '令牌刷新失败'
            });
        }
    }

    // 用户退出
    async logout(req, res) {
        try {
            // 在实际应用中，这里可以撤销刷新令牌
            // 由于我们使用无状态JWT，这里主要清理客户端token
            
            res.json({
                success: true,
                message: '退出成功'
            });

        } catch (error) {
            console.error('退出错误:', error);
            res.status(500).json({
                success: false,
                message: '退出失败'
            });
        }
    }

    // 获取当前用户信息
    async getMe(req, res) {
        try {
            const user = await userModel.findById(req.user.userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: '用户不存在'
                });
            }

            res.json({
                success: true,
                data: { user }
            });

        } catch (error) {
            console.error('获取用户信息错误:', error);
            res.status(500).json({
                success: false,
                message: '获取用户信息失败'
            });
        }
    }
}

module.exports = new AuthController();