const { pool } = require('../config/database');

class OrderModel {
    // 创建订单
    async create(orderData) {
        const {
            id, userId, productId, productName, price, quantity,
            buyerInfo, recipientInfo, giftMessage, deliveryDate, status
        } = orderData;

        console.log('🗃️🗃️ 订单模型接收到的状态值:', {
            status: status,
            type: typeof status
        });

        const query = `
            INSERT INTO orders (id, user_id, product_id, product_name, price, quantity, 
                                buyer_info, recipient_info, gift_message, delivery_date, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const values = [
            id, 
            userId, 
            productId, 
            productName, 
            price, 
            quantity,
            JSON.stringify(buyerInfo), 
            JSON.stringify(recipientInfo), 
            giftMessage, 
            deliveryDate, 
            status  // 这里应该是 "unpaid"
        ];

        console.log('🗃️🗃️ 准备插入数据库的值:', values);

        const [result] = await pool.execute(query, values);
        return result;
    }

    // 根据用户ID获取订单列表
    async findByUserId(userId) {
        const query = `
            SELECT * FROM orders 
            WHERE user_id = ? 
            ORDER BY created_at DESC
        `;
        const [rows] = await pool.execute(query, [userId]);
        return rows;
    }

    // 根据订单ID获取订单
    async findById(orderId) {
        const query = 'SELECT * FROM orders WHERE id = ?';
        const [rows] = await pool.execute(query, [orderId]);
        return rows[0];
    }

    // 更新订单状态
    async updateStatus(orderId, status) {
        const query = 'UPDATE orders SET status = ? WHERE id = ?';
        const [result] = await pool.execute(query, [status, orderId]);
        return result;
    }

    // 获取用户订单统计
    async getStats(userId) {
        const query = `
            SELECT 
                COUNT(*) as totalOrders,
                SUM(price * quantity) as totalAmount,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pendingOrders,
                SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as completedOrders
            FROM orders 
            WHERE user_id = ?
        `;
        const [rows] = await pool.execute(query, [userId]);
        return rows[0];
    }

    // 检查订单是否属于用户
    async isOrderBelongsToUser(orderId, userId) {
        const query = 'SELECT COUNT(*) as count FROM orders WHERE id = ? AND user_id = ?';
        const [rows] = await pool.execute(query, [orderId, userId]);
        return rows[0].count > 0;
    }

        // 更新支付信息
    async updatePaymentInfo(orderId, paymentInfo) {
        const query = `
            UPDATE orders 
            SET payment_method = ?, payment_amount = ?, updated_at = NOW() 
            WHERE id = ?
        `;
        const [result] = await pool.execute(query, [
            paymentInfo.paymentMethod,
            paymentInfo.paymentAmount,
            orderId
        ]);
        return result;
    }

    // 更新支付成功信息
    async updatePaymentSuccess(orderId, paymentData) {
        const query = `
            UPDATE orders 
            SET status = 'paid', 
                trade_no = ?, 
                pay_time = ?, 
                payment_amount = ?, 
                updated_at = NOW() 
            WHERE id = ?
        `;
        const [result] = await pool.execute(query, [
            paymentData.tradeNo,
            paymentData.payTime,
            paymentData.paymentAmount,
            orderId
        ]);
        return result;
    }

    // 根据交易号查找订单
    async findByTradeNo(tradeNo) {
        const query = 'SELECT * FROM orders WHERE trade_no = ?';
        const [rows] = await pool.execute(query, [tradeNo]);
        return rows[0];
    }
}

module.exports = new OrderModel();