-- 修改 orders 表的 status 枚举
ALTER TABLE orders 
MODIFY COLUMN status 
ENUM('unpaid', 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled') 
DEFAULT 'unpaid';

-- 验证修改是否成功
SHOW COLUMNS FROM orders LIKE 'status';