const authUtils = require('../utils/authUtils');

// 认证令牌中间件
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ 
            success: false, 
            message: '访问令牌必填' 
        });
    }

    try {
        const decoded = authUtils.verifyToken(token);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ 
            success: false, 
            message: '令牌无效或已过期' 
        });
    }
};

// 可选认证中间件（不阻断请求）
const optionalAuth = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
        try {
            const decoded = authUtils.verifyToken(token);
            req.user = decoded;
        } catch (error) {
            // Token无效但不阻断请求
        }
    }
    next();
};

module.exports = {
    authenticateToken,
    optionalAuth
};