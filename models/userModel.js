const { pool } = require('../config/database');

class UserModel {
    // 根据用户名查找用户
    async findByUsername(username) {
        const [rows] = await pool.execute(
            'SELECT * FROM users WHERE username = ? AND status = "active"', 
            [username]
        );
        return rows[0];
    }

    // 根据邮箱查找用户
    async findByEmail(email) {
        const [rows] = await pool.execute(
            'SELECT * FROM users WHERE email = ? AND status = "active"', 
            [email]
        );
        return rows[0];
    }

    // 根据手机号查找用户
    async findByPhone(phone) {
        const [rows] = await pool.execute(
            'SELECT * FROM users WHERE phone = ? AND status = "active"', 
            [phone]
        );
        return rows[0];
    }

    // 检查用户名、邮箱、手机号是否已存在
    async checkExistingUser(username, email, phone) {
        const [rows] = await pool.execute(
            'SELECT username, email, phone FROM users WHERE username = ? OR email = ? OR phone = ?',
            [username, email, phone]
        );
        return rows;
    }

    // 根据ID查找用户（不返回密码）
    async findById(id) {
        const [rows] = await pool.execute(
            `SELECT id, username, email, phone, created_at, updated_at, last_login, status 
             FROM users WHERE id = ? AND status = "active"`, 
            [id]
        );
        return rows[0];
    }

    // 创建用户
    async create(userData) {
        const { id, username, email, phone, password_hash } = userData;
        const [result] = await pool.execute(
            'INSERT INTO users (id, username, email, phone, password_hash) VALUES (?, ?, ?, ?, ?)',
            [id, username, email, phone, password_hash]
        );
        return result.insertId;
    }

    // 更新用户最后登录时间
    async updateLastLogin(id) {
        await pool.execute(
            'UPDATE users SET last_login = NOW() WHERE id = ?',
            [id]
        );
    }

        // 更新用户密码
    async updatePassword(userId, newPasswordHash) {
        const query = 'UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?';
        const [result] = await pool.execute(query, [newPasswordHash, userId]);
        return result;
    }
    
    // 根据邮箱查找用户（包含密码字段）
    async findByEmailWithPassword(email) {
        const [rows] = await pool.execute(
            'SELECT * FROM users WHERE email = ? AND status = "active"', 
            [email]
        );
        return rows[0];
    }
}

module.exports = new UserModel();