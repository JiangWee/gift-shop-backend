const googleSheetsUtils = require('../utils/googleSheetsUtils');
const authUtils = require('../utils/authUtils');

class OrderController {
    // 创建新订单
    async createOrder(req, res) {
        try {
            const { 
                product_id, 
                product_name, 
                price, 
                quantity = 1, 
                buyer_info, 
                recipient_info, 
                gift_message, 
                delivery_date 
            } = req.body;
            
            const user = req.user;

            // 生成订单ID
            const orderId = authUtils.generateOrderId();

            // 准备订单数据
            const orderData = {
                orderId,
                userId: user.userId,
                userEmail: user.email,
                productName: product_name,
                price: parseFloat(price),
                quantity: parseInt(quantity),
                buyerName: buyer_info.name,
                recipientName: recipient_info.name,
                buyerInfo: buyer_info,
                recipientInfo: recipient_info,
                giftMessage: gift_message || '',
                deliveryDate: delivery_date || null,
                status: 'pending'
            };

            // 保存到Google表格
            const result = await googleSheetsUtils.addOrder(orderData);

            res.status(201).json({
                success: true,
                message: '订单创建成功',
                data: { 
                    orderId,
                    orderDate: new Date().toISOString(),
                    sheetInfo: result
                }
            });

        } catch (error) {
            console.error('创建订单错误:', error);
            res.status(500).json({
                success: false,
                message: error.message || '订单创建失败，请稍后重试'
            });
        }
    }

    // 获取用户订单列表
    async getOrders(req, res) {
        try {
            const user = req.user;
            const orders = await googleSheetsUtils.getUserOrders(user.userId);

            res.json({
                success: true,
                data: { 
                    orders,
                    total: orders.length,
                    message: orders.length === 0 ? '暂无订单' : '获取订单成功'
                }
            });

        } catch (error) {
            console.error('获取订单列表错误:', error);
            res.status(500).json({
                success: false,
                message: '获取订单列表失败'
            });
        }
    }

    // 获取订单详情
    async getOrderById(req, res) {
        try {
            const { id } = req.params;
            const user = req.user;
            
            // 获取用户所有订单
            const orders = await googleSheetsUtils.getUserOrders(user.userId);
            const order = orders.find(o => o.orderId === id);

            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: '订单不存在'
                });
            }

            res.json({
                success: true,
                data: { order }
            });

        } catch (error) {
            console.error('获取订单详情错误:', error);
            res.status(500).json({
                success: false,
                message: '获取订单详情失败'
            });
        }
    }

    // 更新订单状态
    async updateOrderStatus(req, res) {
        try {
            const { id } = req.params;
            const { status } = req.body;
            const user = req.user;

            // 验证状态值
            const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: '无效的订单状态'
                });
            }

            // 先验证订单属于当前用户
            const orders = await googleSheetsUtils.getUserOrders(user.userId);
            const orderExists = orders.some(o => o.orderId === id);
            
            if (!orderExists) {
                return res.status(404).json({
                    success: false,
                    message: '订单不存在'
                });
            }

            // 更新订单状态
            await googleSheetsUtils.updateOrderStatus(id, status);

            res.json({
                success: true,
                message: '订单状态更新成功',
                data: { orderId: id, newStatus: status }
            });

        } catch (error) {
            console.error('更新订单状态错误:', error);
            res.status(500).json({
                success: false,
                message: error.message || '更新订单状态失败'
            });
        }
    }

    // 获取订单统计
    async getOrderStats(req, res) {
        try {
            const user = req.user;
            const orders = await googleSheetsUtils.getUserOrders(user.userId);

            const stats = {
                totalOrders: orders.length,
                totalAmount: orders.reduce((sum, order) => sum + (order.price * order.quantity), 0),
                pendingOrders: orders.filter(o => o.status === 'pending').length,
                completedOrders: orders.filter(o => o.status === 'delivered').length,
                averageOrderValue: orders.length > 0 
                    ? orders.reduce((sum, order) => sum + (order.price * order.quantity), 0) / orders.length 
                    : 0
            };

            res.json({
                success: true,
                data: { stats }
            });

        } catch (error) {
            console.error('获取订单统计错误:', error);
            res.status(500).json({
                success: false,
                message: '获取订单统计失败'
            });
        }
    }
}

module.exports = new OrderController();