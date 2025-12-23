const orderModel = require('../models/orderModel');
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
                status_front,  // 这里应该是 "unpaid"
                buyer_info, 
                recipient_info, 
                gift_message, 
                delivery_date 
            } = req.body;
            
            console.log('🔍🔍 创建订单接收到的状态:', {
                status_front: status_front,
                type: typeof status_front
            });

            const user = req.user;

            // 生成订单ID
            const orderId = authUtils.generateOrderId();

            // 准备订单数据 - 重点检查这里
            const orderData = {
                id: orderId,
                userId: user.userId,
                productId: product_id,
                productName: product_name,
                price: parseFloat(price),
                quantity: parseInt(quantity),
                buyerInfo: buyer_info || {},
                recipientInfo: recipient_info || {},
                giftMessage: gift_message || '',
                deliveryDate: delivery_date || null,
                status: status_front  // 这里应该保存 "unpaid"
            };

            console.log('📦📦 准备保存到数据库的订单数据:', orderData);

            // 保存到数据库
            await orderModel.create(orderData);

            res.status(201).json({
                success: true,
                message: '订单创建成功',
                data: { 
                    orderId,
                    orderDate: new Date().toISOString()
                }
            });

        } catch (error) {
            console.error('❌❌ 创建订单错误:', error);
            res.status(500).json({
                success: false,
                message: '订单创建失败，请稍后重试'
            });
        }
    }

    // 获取用户订单列表
    async getOrders(req, res) {
        try {
            const user = req.user;
            const orders = await orderModel.findByUserId(user.userId);

            // 格式化返回数据
            const formattedOrders = orders.map(order => {
                // 在这里打印每个订单的 status
                console.log('📋📋 订单状态:', {
                    orderId: order.id,
                    status: order.status,
                    productName: order.product_name
                });
                
                return {
                    orderId: order.id,
                    userId: order.user_id,
                    productId: order.product_id,
                    productName: order.product_name,
                    price: parseFloat(order.price),
                    quantity: order.quantity,
                    buyerInfo: JSON.parse(order.buyer_info || '{}'),
                    recipientInfo: JSON.parse(order.recipient_info || '{}'),
                    giftMessage: order.gift_message,
                    deliveryDate: order.delivery_date,
                    status: order.status,
                    createdAt: order.created_at,
                    updatedAt: order.updated_at
                };
            });
            res.json({
                success: true,
                data: { 
                    orders: formattedOrders,
                    total: formattedOrders.length,
                    message: formattedOrders.length === 0 ? '暂无订单' : '获取订单成功'
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
            
            const order = await orderModel.findById(id);

            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: '订单不存在'
                });
            }

            // 验证订单属于当前用户
            if (order.user_id !== user.userId) {
                return res.status(403).json({
                    success: false,
                    message: '无权访问此订单'
                });
            }

            // 格式化订单数据
            const formattedOrder = {
                orderId: order.id,
                userId: order.user_id,
                productId: order.product_id,
                productName: order.product_name,
                price: parseFloat(order.price),
                quantity: order.quantity,
                buyerInfo: JSON.parse(order.buyer_info || '{}'),
                recipientInfo: JSON.parse(order.recipient_info || '{}'),
                giftMessage: order.gift_message,
                deliveryDate: order.delivery_date,
                status: order.status,
                createdAt: order.created_at,
                updatedAt: order.updated_at
            };

            res.json({
                success: true,
                data: { order: formattedOrder }
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
            const orderExists = await orderModel.isOrderBelongsToUser(id, user.userId);
            if (!orderExists) {
                return res.status(404).json({
                    success: false,
                    message: '订单不存在'
                });
            }

            // 更新订单状态
            await orderModel.updateStatus(id, status);

            res.json({
                success: true,
                message: '订单状态更新成功',
                data: { orderId: id, newStatus: status }
            });

        } catch (error) {
            console.error('更新订单状态错误:', error);
            res.status(500).json({
                success: false,
                message: '更新订单状态失败'
            });
        }
    }

    // 获取订单统计
    async getOrderStats(req, res) {
        try {
            const user = req.user;
            const stats = await orderModel.getStats(user.userId);

            // 计算平均订单价值
            const averageOrderValue = stats.totalOrders > 0 
                ? stats.totalAmount / stats.totalOrders 
                : 0;

            const enhancedStats = {
                totalOrders: stats.totalOrders || 0,
                totalAmount: parseFloat(stats.totalAmount || 0).toFixed(2),
                pendingOrders: stats.pendingOrders || 0,
                completedOrders: stats.completedOrders || 0,
                averageOrderValue: parseFloat(averageOrderValue).toFixed(2)
            };

            res.json({
                success: true,
                data: { stats: enhancedStats }
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