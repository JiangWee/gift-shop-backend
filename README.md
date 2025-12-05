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