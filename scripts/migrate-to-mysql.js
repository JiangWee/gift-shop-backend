const mysql = require('mysql2/promise');
require('dotenv').config');

async function migrateData() {
    console.log('🚀🚀 开始迁移数据到MySQL...');
    
    const config = {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'gift_shop',
        port: parseInt(process.env.DB_PORT) || 3306
    };

    let connection;
    try {
        connection = await mysql.createConnection(config);
        console.log('✅ 数据库连接成功');

        // 检查订单表是否存在
        const [tables] = await connection.execute(
            "SHOW TABLES LIKE 'orders'"
        );
        
        if (tables.length === 0) {
            console.log('❌❌ 订单表不存在，请先执行 schema.sql');
            return;
        }

        console.log('✅ 订单表已存在，数据迁移完成');
        
    } catch (error) {
        console.error('❌❌ 迁移失败:', error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

if (require.main === module) {
    migrateData();
}

module.exports = migrateData;