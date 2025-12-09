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

-- 订单表
CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(50) PRIMARY KEY COMMENT '订单ID',
    user_id VARCHAR(50) NOT NULL COMMENT '用户ID',
    product_id VARCHAR(100) NOT NULL COMMENT '产品ID',
    product_name VARCHAR(255) NOT NULL COMMENT '产品名称',
    price DECIMAL(10,2) NOT NULL COMMENT '价格',
    quantity INT DEFAULT 1 COMMENT '数量',
    buyer_info JSON COMMENT '购买者信息（JSON格式）',
    recipient_info JSON COMMENT '收件人信息（JSON格式）',
    gift_message TEXT COMMENT '礼品留言',
    delivery_date DATE COMMENT '送达日期',
    status ENUM('pending', 'confirmed', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending' COMMENT '订单状态',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='订单表';

-- 插入测试用户（可选）
INSERT INTO users (id, email, phone, password_hash, username) VALUES 
('user_test_123', 'test@example.com', '13800138000', '$2a$12$LQv3c1yqBd8r6BQY9n8ZZe6YvQ6cW8lW8cL8z8n8X8v8Y8z8B8C8D', '测试用户');

-- 查看表结构
SHOW TABLES;
DESCRIBE users;
DESCRIBE orders;