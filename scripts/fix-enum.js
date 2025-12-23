// fix-enum.js
require('dotenv').config();
const mysql = require('mysql2/promise');

async function fixDatabase() {
    let connection;
    try {
        console.log('🔗 连接到 Railway 数据库...');
        
        // 使用 Railway 的环境变量
        const config = {
            host: process.env.MYSQL_PUBLIC_URL,
            user: process.env.MYSQLUSER,
            password: process.env.MYSQL_ROOT_PASSWORD,
            database: process.env.MYSQL_DATABASE,
            port: process.env.MYSQLPORT || 3306,
            ssl: {} // Railway 通常需要 SSL
        };

        console.log('📊 连接配置:', {
            host: config.host,
            user: config.user,
            database: config.database,
            port: config.port
        });

        connection = await mysql.createConnection(config);
        console.log('✅ 数据库连接成功');

        // 执行修改
        console.log('🔄 开始修改枚举值...');
        const [result] = await connection.execute(`
            ALTER TABLE orders 
            MODIFY COLUMN status 
            ENUM('pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'unpaid') 
            DEFAULT 'pending'
        `);
        
        console.log('✅ 枚举值修改成功！');

        // 验证修改
        const [columns] = await connection.execute("SHOW COLUMNS FROM orders LIKE 'status'");
        console.log('📊 修改后的字段信息:');
        console.log('- 字段名:', columns[0].Field);
        console.log('- 类型:', columns[0].Type);
        console.log('- 默认值:', columns[0].Default);

        // 测试插入
        console.log('🧪 测试插入 unpaid 状态...');
        const testId = 'test_unpaid_' + Date.now();
        await connection.execute(`
            INSERT INTO orders (id, user_id, product_id, product_name, price, quantity, status)
            VALUES (?, 'test_user', 'test_product', '测试产品', 100.00, 1, 'unpaid')
        `, [testId]);
        console.log('✅ 测试插入成功');

        // 清理测试数据
        await connection.execute('DELETE FROM orders WHERE id = ?', [testId]);
        console.log('🧹 测试数据已清理');

    } catch (error) {
        console.error('❌ 执行失败:');
        console.error('错误信息:', error.message);
        console.error('错误代码:', error.code);
        console.error('SQL状态:', error.sqlState);
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 数据库连接已关闭');
        }
    }
}

// 执行修复
fixDatabase();