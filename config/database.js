const mysql = require('mysql2/promise');

// 解析数据库URL（适用于PlanetScale、Railway等）
function parseDatabaseUrl() {
    if (process.env.DATABASE_URL) {
        const url = new URL(process.env.DATABASE_URL);
        return {
            host: url.hostname,
            port: url.port || 3306,
            user: url.username,
            password: url.password,
            database: url.pathname.replace('/', ''),
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined
        };
    }
    
    // 备用本地配置
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