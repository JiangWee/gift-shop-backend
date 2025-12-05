require('dotenv').config();
const app = require('./app');

const port = process.env.PORT || 3000;

// 只在本地环境启动服务器
if (process.env.NODE_ENV !== 'production' || process.env.VERCEL !== '1') {
    app.listen(port, () => {
        console.log(`🚀 礼品电商混合后端服务器启动成功`);
        console.log(`📍 服务地址: http://localhost:${port}`);
        console.log(`🌱 环境: ${process.env.NODE_ENV || 'development'}`);
        console.log(`🏗️  架构: 用户认证(MySQL) + 订单管理(Google Sheets)`);
        console.log(`⏰ 启动时间: ${new Date().toISOString()}`);
    });
}

module.exports = app;