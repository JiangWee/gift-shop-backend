const mysql = require('mysql2/promise');

async function testMySQL() {
    console.log('🧪 开始测试MySQL连接...');
    console.log('='.repeat(50));
    
    const config = {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'gift_shop',
        port: parseInt(process.env.DB_PORT) || 3306
    };

    console.log('🔧 连接配置:', {
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
        console.log('🧪 简单计算测试:', rows[0].result);

        // 测试数据库版本
        const [versionRows] = await connection.execute('SELECT VERSION() as version');
        console.log('📊 MySQL版本:', versionRows[0].version);

        // 测试查询用户表
        try {
            const [users] = await connection.execute('SELECT * FROM users LIMIT 5');
            console.log(`👥 找到 ${users.length} 个用户`);
            
            users.forEach((user, index) => {
                console.log(`   ${index + 1}. ${user.email} (${user.username})`);
            });
        } catch (tableError) {
            console.log('💡 提示: 用户表可能不存在，我们可以创建它');
        }

    } catch (error) {
        console.error('❌ MySQL连接失败:');
        console.error('   错误信息:', error.message);
        console.error('\n💡 排查建议:');
        console.error('   1. 检查MySQL服务是否启动');
        console.error('   2. 检查用户名和密码是否正确');
        console.error('   3. 检查数据库是否存在');
        console.error('   4. 检查防火墙设置');
        return false;
    } finally {
        // 关闭连接
        if (connection) {
            await connection.end();
            console.log('🔌 连接已关闭');
        }
    }

    console.log('='.repeat(50));
    console.log('🎉 MySQL测试完成！');
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