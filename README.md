# 礼品电商后端 API

用户认证和订单管理使用 MySQL 数据库。
这其中后端，数据库托管在Railway。

------------------------------------------
本地验证：
用XAMPP构建数据库（运行apache，mysql），然后运行npm start启动。

PS C:\code\gift-shop-backend> npm start

> gift-shop-hybrid-backend@1.0.0 start
> node server.js

🚀 礼品电商混合后端服务器启动成功
🚀 Server running on port 3000
📊 Environment: production
🏗️  架构: 用户认证 + 订单管理(MySQL)
⏰ 启动时间: 2025-12-18T07:38:59.573Z
-------------------------------------------------------------------


后端工作的流程大致如下：
用户请求 → API路由 → 中间件验证 → 控制器处理 → 数据库 → 返回响应


## 架构特点

- **用户认证**: MySQL 数据库
- **订单管理**: MySQL 数据库
- **部署平台**: 
- **认证方式**: JWT Token

## 功能特性

### 用户认证功能
- ✅ 用户注册/登录
- ✅ JWT Token 认证
- ✅ 密码加密存储
- ✅ Token 刷新机制

### 订单管理功能  
- ✅ 创建新订单
- ✅ 查询用户订单
- ✅ 订单状态更新
- ✅ 订单统计信息

## 快速开始

### 环境要求

- Node.js 18+
- MySQL 数据库（或 PlanetScale）
- Google Sheets API 权限

### 安装步骤

1. **克隆项目**
```bash
git clone https://github.com/JiangWee/gift-shop-backend.git
cd gift-shop-backend

```

## 代码架构

gift-shop-backend/
├── api/index.js              # ✅ Vercel入口
├── config/
│   ├── database.js          # ✅ MySQL数据库配置
│   └── google-sheets.js     # ✅ Google Sheets配置
├── controllers/
│   ├── authController.js    # ✅ 用户认证逻辑
│   └── orderController.js   # ✅ 订单管理逻辑
├── middleware/
│   ├── authMiddleware.js    # ✅ JWT认证中间件
│   └── validationMiddleware.js # ✅ 数据验证
├── models/
│   └── userModel.js         # ✅ 用户数据模型
├── routes/
│   ├── authRoutes.js        # ✅ 认证路由
│   └── orderRoutes.js       # ✅ 订单路由
├── utils/
│   ├── authUtils.js         # ✅ 认证工具
│   └── googleSheetsUtils.js # ✅ Google Sheets工具
├── database/schema.sql      # ✅ 数据库表结构
├── scripts/test-api.js      # ✅ API测试脚本
├── app.js                   # ✅ Express应用配置
├── server.js                # ✅ 本地服务器入口
├── package.json             # ✅ 项目配置
├── vercel.json              # ✅ Vercel部署配置
└── README.md                # ✅ 项目说明

app.js​ - 整个应用的"大脑"，配置所有功能
​server.js​ - 启动服务器的入口文件
​routes/​​* - 定义API接口地址（像网站的导航菜单）
​controllers/​​* - 处理业务逻辑（像餐厅的厨师）
​models/​​* - 数据库操作（像仓库管理员）
​middleware/​​* - 请求预处理（像安检人员）


## 从零开始



第1天：环境搭建和基础理解
​1. 安装必要软件​：

bash
复制
- 1. 安装 Node.js（从官网下载）
- 2. 安装 MySQL（可以用XAMPP简化）
- 3. 安装 VS Code 扩展：
-    - ESLint
-    - Prettier 
-    - MySQL
-    - Thunder Client（API测试）
​2. 创建项目结构​：

bash
复制
- 在你的Windows上创建项目文件夹
mkdir gift-shop-backend
cd gift-shop-backend

- 按照你提供的架构创建所有文件夹
mkdir api config controllers middleware models routes utils database scripts
​3. 创建 package.json​：

json
复制
{
  "name": "gift-shop-backend",
  "version": "1.0.0",
  "scripts": {
    "dev": "nodemon server.js",
    "start": "node server.js",
    "test": "node scripts/test-api.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "mysql2": "^3.6.0",
    "jsonwebtoken": "^9.0.0",
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "helmet": "^7.0.0",
    "express-rate-limit": "^6.7.0",
    "dotenv": "^16.0.3",
    "express-validator": "^7.0.1",
    "googleapis": "^105.0.0",
    "uuid": "^9.0.0"
  },
  "devDependencies": {
    "nodemon": "^2.0.20"
  }
}
第2天：核心概念理解
​理解这个项目的核心流程​：

复制
用户请求 → API路由 → 中间件验证 → 控制器处理 → 数据库/Google Sheets → 返回响应
​重点学习每个文件的作用​：

​app.js​ - 整个应用的"大脑"，配置所有功能
​server.js​ - 启动服务器的入口文件
​routes/​​* - 定义API接口地址（像网站的导航菜单）
​controllers/​​* - 处理业务逻辑（像餐厅的厨师）
​models/​​* - 数据库操作（像仓库管理员）
​middleware/​​* - 请求预处理（像安检人员）
第3天：动手实践
​1. 创建 .env 环境变量文件​：

env
复制
- 数据库配置
DATABASE_URL=mysql://username:password@localhost:3306/gift_shop
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=gift_shop

- JWT密钥
JWT_SECRET=your_super_secret_key_here

- Google Sheets配置
GOOGLE_SHEET_ID=your_google_sheet_id
GOOGLE_CREDENTIALS_JSON={"type": "service_account", ...}

- 服务器配置
PORT=3000
NODE_ENV=development
​2. 逐步测试每个模块​：

先从最简单的开始测试：

javascript
运行
复制
// 测试1：基础Express服务器
// 修改 server.js，添加简单路由测试
app.get('/test', (req, res) => {
  res.json({ message: '服务器运行正常！', timestamp: new Date() });
});
第4天：数据库和API测试
​1. 设置MySQL数据库​：

sql
复制
-- 使用MySQL Workbench或命令行执行 schema.sql
-- 创建数据库和用户表
​2. 使用Thunder Client测试API​：

安装VS Code的Thunder Client扩展，然后创建测试请求：

​注册测试​：

复制
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
  "email": "test@example.com",
  "phone": "13800138000",
  "password": "Test123456",
  "confirm": "Test123456"
}
🛠 第四步：详细调试指南
调试技巧（适合小白）：
​1. 添加控制台日志​：

javascript
运行
复制
// 在任何你想了解代码执行的地方添加
console.log('🔍 执行到这里，当前数据:', { 
  userId: userId, 
  email: email 
});

// 在错误处理中添加详细日志
console.error('❌ 错误详情:', {
  message: error.message,
  stack: error.stack,
  timestamp: new Date().toISOString()
});
​2. 使用VS Code调试功能​：

创建 .vscode/launch.json：

json
复制
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "启动程序",
      "skipFiles": ["<node_internals>/**"],
      "program": "${workspaceFolder}/server.js",
      "env": {
        "NODE_ENV": "development"
      }
    }
  ]
}
​3. 分模块测试​：

先测试认证模块：

bash
复制
- 只启动认证相关功能，注释掉订单路由
npm run dev
再测试订单模块：

bash
复制
- 恢复订单路由，测试完整功能
📋 第五步：完整验证清单
完成以下检查后，你的项目就能正常运行：

 ✅ Node.js 和 npm 已安装
 ✅ MySQL 数据库已安装并运行
 ✅ 所有文件夹结构正确创建
 ✅ package.json 依赖已安装 (npm install)
 ✅ .env 环境变量文件已配置
 ✅ 数据库表已创建 (执行 schema.sql)
 ✅ 服务器能正常启动 (npm run dev)
 ✅ 基础API测试通过 (访问 http://localhost:3000)
 ✅ 用户注册/登录功能测试通过
 ✅ 订单创建功能测试通过
💡 学习建议
​不要急于求成​ - 每天学习2-3小时，循序渐进
​先理解后编码​ - 弄懂每个文件的作用再写代码
​多用调试工具​ - console.log 是你的好朋友
​遇到问题先搜索​ - 大部分问题Stack Overflow都有答案
​多做笔记​ - 记录学习过程中的重点和问题


测试各种场景​：不仅要测试支付成功，还要充分测试支付失败、网络超时、用户中途关闭页面、重复支付等各种边缘情况，确保系统健壮性