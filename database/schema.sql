-- 礼品电商网站数据库结构
CREATE DATABASE IF NOT EXISTS gift_shop CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE gift_shop;

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY COMMENT '用户ID',
    email VARCHAR(255) UNIQUE NOT NULL COMMENT '邮箱',
    phone VARCHAR(20) UNIQUE COMMENT '手机号',
    password_hash VARCHAR(255) NOT NULL COMMENT '密码哈希',
    username VARCHAR(100) COMMENT '用户名',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    last_login TIMESTAMP NULL COMMENT '最后登录时间',
    status ENUM('active', 'inactive') DEFAULT 'active' COMMENT '用户状态',
    INDEX idx_email (email),
    INDEX idx_phone (phone),
    INDEX idx_status (status)
) ENGINE=InnoDB COMMENT='用户表';

-- 插入测试用户（可选）
INSERT INTO users (id, email, phone, password_hash, username) VALUES 
('user_test_123', 'test@example.com', '13800138000', '$2a$12$LQv3c1yqBd8r6BQY9n8ZZe6YvQ6cW8lW8cL8z8n8X8v8Y8z8B8C8D', '测试用户');

-- 查看表结构
SHOW TABLES;
DESCRIBE users;