# 礼品电商后端API文档

## 认证接口

### 用户注册
**POST** `/api/auth/register`

请求体：
```json
{
  "email": "user@example.com",
  "phone": "13800138000",
  "password": "Test123456",
  "confirm": "Test123456"
}
```
响应：
```json
json
{
  "success": true,
  "message": "注册成功",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user_123456",
      "email": "user@example.com",
      "username": "user",
      "phone": "13800138000",
      "created_at": "2024-01-15T10:30:00.000Z"
    }
  }
}
```
用户登录
​POST​ /api/auth/login

请求体：
```json
{
  "identifier": "user@example.com", // 或手机号
  "password": "Test123456"
}
```
获取用户信息
​GET​ /api/auth/me

请求头：
Authorization: Bearer {accessToken}