const userModel = require('../models/userModel');
const authUtils = require('../utils/authUtils');

class AuthController {
    // 用户注册
    async register(req, res) {
        try {
            const { username, email, phone, password, confirm } = req.body;
            
            // 检查必填字段
            if (!username || !email || !phone || !password) {
                return res.status(400).json({
                    success: false,
                    message: '请填写所有必填字段'
                });
            }
            
            // 检查用户名、邮箱、手机号是否已存在
            const existingUsers = await userModel.checkExistingUser(username, email, phone);
            if (existingUsers.length > 0) {
                const existingUsername = existingUsers.find(u => u.username === username);
                const existingEmail = existingUsers.find(u => u.email === email);
                const existingPhone = existingUsers.find(u => u.phone === phone);
                
                if (existingUsername) {
                    return res.status(409).json({
                        success: false,
                        message: '该用户名已被注册'
                    });
                }
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
                username,
                email,
                phone,
                password_hash: passwordHash
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

            const responseData = {
                success: true,
                message: '注册成功',
                data: {
                    accessToken,
                    refreshToken,
                    user: {
                        id: userId,
                        username,
                        email,
                        phone
                    }
                }
            };

            console.log('注册响应数据:', JSON.stringify(responseData, null, 2));
            
            res.status(201).json(responseData);

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
            console.log('登录请求参数:', { identifier, password });

            // 根据用户名、邮箱或手机号查找用户
            let user = await userModel.findByUsername(identifier);
            if (!user) {
                user = await userModel.findByEmail(identifier);
            }
            if (!user) {
                user = await userModel.findByPhone(identifier);
            }

            console.log('查询到的用户:', user);

            // 用户不存在
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: '用户不存在，请先注册'
                });
            }

            // 验证密码
            const isPasswordValid = await authUtils.comparePassword(password, user.password_hash);
            console.log('密码验证结果:', isPasswordValid);

            if (!isPasswordValid) {
                return res.status(401).json({
                    success: false,
                    message: '密码错误'
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

            console.log('生成的Token:', { accessToken, refreshToken });

            // 更新最后登录时间
            await userModel.updateLastLogin(user.id);

            const responseData = {
                success: true,
                message: '登录成功',
                data: {
                    accessToken,
                    refreshToken,
                    user: {
                        id: user.id,
                        username: user.username,
                        email: user.email,
                        phone: user.phone
                    }
                }
            };

            console.log('登录响应数据:', JSON.stringify(responseData, null, 2));
            
            res.json(responseData);

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