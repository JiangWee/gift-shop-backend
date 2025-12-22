const mysql = require('mysql2/promise');

// 解析数据库URL（适用于PlanetScale、Railway等）
function parseDatabaseUrl() {
    console.log('process.env.DB_HOST:',process.env.DB_HOST);
    console.log('process.env.DB_USER:',process.env.DB_USER);
    console.log('process.env.DB_NAME:',process.env.DB_NAME);
    console.log('process.env.DB_PORT:',process.env.DB_PORT);
    return {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'gift_shop',
        port: process.env.DB_PORT || 3306,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        charset: 'utf8mb4'
    };
}

const dbConfig = parseDatabaseUrl();

// 创建数据库连接池
const pool = mysql.createPool(dbConfig);

// 测试数据库连接
const testConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('✅ 用户数据库连接成功');
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ 用户数据库连接失败:', error.message);
        return false;
    }
};

module.exports = {
    pool,
    testConnection
};