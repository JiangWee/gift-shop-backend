const { pool } = require('../config/database');

class UserModel {
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

    // 根据ID查找用户（不返回密码）
    async findById(id) {
        const [rows] = await pool.execute(
            `SELECT id, email, phone, username, created_at, updated_at, last_login, status 
             FROM users WHERE id = ? AND status = "active"`, 
            [id]
        );
        return rows[0];
    }

    // 创建用户
    async create(userData) {
        const { id, email, phone, password_hash, username } = userData;
        const [result] = await pool.execute(
            'INSERT INTO users (id, email, phone, password_hash, username) VALUES (?, ?, ?, ?, ?)',
            [id, email, phone, password_hash, username]
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

    // 检查邮箱或手机号是否已存在
    async checkExistingUser(email, phone) {
        const [rows] = await pool.execute(
            'SELECT id, email, phone FROM users WHERE email = ? OR phone = ?',
            [email, phone]
        );
        return rows;
    }
}

module.exports = new UserModel();