# 礼品电商混合后端 API

基于 Node.js + Express 的混合架构后端系统，用户认证使用 MySQL 数据库，订单管理使用 Google Sheets。

## 架构特点

- **用户认证**: MySQL 数据库（安全可靠）
- **订单管理**: Google Sheets（易于管理）
- **部署平台**: Vercel（无服务器架构）
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


## 代码架构

gift-shop-backend/
├── api/
│   └── index.js                      # Vercel无服务器函数入口
├── config/
│   ├── database.js                   # 用户数据库配置
│   └── google-sheets.js              # Google Sheets配置
├── controllers/
│   ├── authController.js             # 用户认证控制器
│   └── orderController.js            # 订单控制器（Google Sheets）
├── middleware/
│   ├── authMiddleware.js             # JWT认证中间件
│   └── validationMiddleware.js       # 数据验证中间件
├── models/
│   └── userModel.js                  # 用户数据模型
├── routes/
│   ├── authRoutes.js                 # 认证路由
│   └── orderRoutes.js                # 订单路由
├── utils/
│   ├── authUtils.js                  # 认证工具函数
│   └── googleSheetsUtils.js          # Google Sheets工具函数
├── app.js                            # Express应用配置
├── server.js                         # 本地开发服务器
├── package.json
├── vercel.json                       # Vercel部署配置
├── .env.example                      # 环境变量示例
└── README.md                         # 项目说明文档