# 用户认证指南

## 概述

本系统使用 JWT（JSON Web Token）进行身份认证。用户需要先注册账号，然后使用用户名和密码登录获取 Token，后续所有 API 请求需在 Header 中携带该 Token。

## 快速开始

### 1. 注册用户

**接口**: `POST /api/auth/register`

**请求体**:
```json
{
  "username": "your_username",
  "password": "your_password"
}
```

**成功响应** (200):
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

**错误响应**:
- `400` - 用户名已存在

### 2. 登录

**接口**: `POST /api/auth/login`

**请求体**:
```json
{
  "username": "your_username",
  "password": "your_password"
}
```

**成功响应** (200):
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

**错误响应**:
- `401` - 用户名或密码错误

### 3. 使用 Token 访问受保护接口

登录成功后，在所有需要认证的 API 请求中添加 Header：

```
Authorization: Bearer <access_token>
```

**cURL 示例**:
```bash
curl -X GET http://localhost:8000/api/notes \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## Token 说明

| 属性 | 值 |
|------|------|
| 有效期 | 7 天 (10080 分钟) |
| 加密算法 | HS256 |
| 存储位置 | 前端 localStorage |

Token 过期后，前端会自动跳转至登录页。

## 通过 Swagger UI 测试

启动后端后访问: **http://localhost:8000/docs**

1. 点击 `/api/auth/register` → "Try it out" → 输入用户名密码 → Execute
2. 点击 `/api/auth/login` → 使用刚注册的账号登录 → 复制返回的 `access_token`
3. 点击页面右上角的 🔓 "Authorize" 按钮 → 粘贴 Token → Authorize
4. 现在可以直接调用所有需要认证的接口

## 安全说明

- 密码使用 bcrypt 加密存储，不可逆
- Token 通过 `SECRET_KEY` 签名，请勿泄露
- 生产环境请修改 `.env` 中的 `SECRET_KEY` 为强随机字符串
