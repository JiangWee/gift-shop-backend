// scripts/test-mysql.js
const mysql = require('mysql2/promise');

async function testMySQL() {
    console.log('🧪🧪 开始测试MySQL连接和订单表...');
    console.log('='.repeat(50));
    
    const config = {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'gift_shop',
        port: parseInt(process.env.DB_PORT) || 3306
    };

    console.log('🔧🔧 连接配置:', {
        host: config.host,
        user: config.user,
        database: config.database,
        port: config.port
    });

    let connection;
    try {
        // 创建连接
        connection = await mysql.createConnection(config);
        console.log('✅ MySQL连接成功！');

        // 测试简单查询
        const [rows] = await connection.execute('SELECT 1 + 1 AS result');
        console.log('🧪🧪 简单计算测试:', rows[0].result);

        // 测试数据库版本
        const [versionRows] = await connection.execute('SELECT VERSION() as version');
        console.log('📊📊 MySQL版本:', versionRows[0].version);

        // 测试查询用户表
        const [users] = await connection.execute('SELECT * FROM users LIMIT 5');
        console.log(`👥👥 找到 ${users.length} 个用户`);
        
        users.forEach((user, index) => {
            console.log(`   ${index + 1}. ${user.email} (${user.username || '无用户名'})`);
        });

        // 测试查询订单表
        const [orders] = await connection.execute('SELECT * FROM orders LIMIT 5');
        console.log(`📦📦 找到 ${orders.length} 个订单`);
        
        orders.forEach((order, index) => {
            console.log(`   ${index + 1}. 订单 ${order.id} - ${order.product_name}`);
        });

        // 测试创建订单（修复外键问题）
        try {
            // 使用数据库中实际存在的用户ID
            if (users.length === 0) {
                console.log('⚠️ 没有用户，无法测试订单');
                return;
            }
            const testUserId = users[0].id;
            
            const testOrder = {
                id: 'TEST_ORDER_' + Date.now(),
                user_id: testUserId,
                product_id: 'test_product',
                product_name: '测试产品',
                price: 99.99,
                quantity: 1,
                buyer_info: {name: '测试买家'},
                recipient_info: {name: '测试收件人'},
                status: 'pending'
            };

            // 使用正确的参数格式
            const [insertResult] = await connection.execute(
                'INSERT INTO orders (id, user_id, product_id, product_name, price, quantity, buyer_info, recipient_info, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [
                    testOrder.id,
                    testOrder.user_id,
                    testOrder.product_id,
                    testOrder.product_name,
                    testOrder.price,
                    testOrder.quantity,
                    JSON.stringify(testOrder.buyer_info),
                    JSON.stringify(testOrder.recipient_info),
                    testOrder.status
                ]
            );
            console.log('✅ 测试订单创建成功，ID:', testOrder.id);

            // 清理测试订单
            await connection.execute('DELETE FROM orders WHERE id = ?', [testOrder.id]);
            console.log('✅ 测试订单清理完成');

        } catch (orderError) {
            console.log('❌ 订单操作测试失败:', orderError.message);
        }

    } catch (error) {
        console.error('❌❌ MySQL连接失败:');
        console.error('   错误信息:', error.message);
        return false;
    } finally {
        // 关闭连接
        if (connection) {
            await connection.end();
            console.log('🔌🔌 连接已关闭');
        }
    }

    console.log('='.repeat(50));
    console.log('🎉🎉 MySQL测试完成！');
    return true;
}

// 如果是直接运行此脚本
if (require.main === module) {
    require('dotenv').config();
    testMySQL().then(success => {
        process.exit(success ? 0 : 1);
    });
}

module.exports = testMySQL;