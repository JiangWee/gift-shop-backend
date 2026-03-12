// controllers/paymentController.js
const paymentService = require('../services/paymentService');
const orderModel = require('../models/orderModel');

class PaymentController {
    /**
     * 创建支付订单
     * POST /api/payment/create
     */
    async createPayment(req, res) {
        try {
            const { orderId, paymentMethod } = req.body;
            const user = req.user; // 从认证中间件获取
            
            console.log('💰 创建支付请求:', { orderId, paymentMethod, userId: user.userId });
            
            if (!orderId || !paymentMethod) {
                return res.status(400).json({
                    success: false,
                    message: '订单ID和支付方式不能为空'
                });
            }
            
            // 验证订单属于当前用户
            const order = await orderModel.findById(orderId);
            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: '订单不存在'
                });
            }
            
            if (order.user_id !== user.userId) {
                return res.status(403).json({
                    success: false,
                    message: '无权操作此订单'
                });
            }
            
            if (order.status !== 'unpaid') {
                return res.status(400).json({
                    success: false,
                    message: '订单状态不允许支付'
                });
            }
            
            const userIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
            const result = await paymentService.createPayment(orderId, paymentMethod, userIp);
            
            if (!result.success) {
                return res.status(400).json(result);
            }
            
            res.json({
                success: true,
                message: '支付创建成功',
                data: result.data
            });
            
        } catch (error) {
            console.error('❌ 创建支付失败:', error);
            res.status(500).json({
                success: false,
                message: '创建支付失败，请稍后重试'
            });
        }
    }
    
    /**
     * 查询支付状态
     * GET /api/payment/status?orderId=xxx&paymentMethod=alipay
     */
    async queryPaymentStatus(req, res) {
        try {
            const { orderId, paymentMethod } = req.query;
            const user = req.user;
            
            console.log('🔍 查询支付状态:', { orderId, paymentMethod, userId: user.userId });
            
            if (!orderId || !paymentMethod) {
                return res.status(400).json({
                    success: false,
                    message: '订单ID和支付方式不能为空'
                });
            }
            
            // 验证订单属于当前用户
            const order = await orderModel.findById(orderId);
            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: '订单不存在'
                });
            }
            
            if (order.user_id !== user.userId) {
                return res.status(403).json({
                    success: false,
                    message: '无权查看此订单'
                });
            }
            
            const result = await paymentService.queryPaymentStatus(orderId, paymentMethod);
            
            if (!result.success) {
                return res.status(400).json(result);
            }
            
            res.json({
                success: true,
                data: result.data
            });
            
        } catch (error) {
            console.error('❌ 查询支付状态失败:', error);
            res.status(500).json({
                success: false,
                message: '查询支付状态失败'
            });
        }
    }
    
    /**
     * 支付宝异步通知回调
     * POST /api/payment/alipay/notify
     */
    async alipayNotify(req, res) {
        try {
            console.log('📩 收到支付宝异步通知 (服务器):', req.body);
            
            const result = await paymentService.handlePaymentNotify('alipay', req.body);
            
            if (result.success) {
                console.log('✅ 支付宝异步通知处理成功:', result.message);
                res.set('Content-Type', 'text/plain');
                res.send('success'); // 支付宝要求返回纯文本success
            } else {
                console.error('❌ 支付宝异步通知处理失败:', result.message);
                res.set('Content-Type', 'text/plain');
                res.send('failure'); // 注意：文档中之前返回的是'fail'，应与支付宝要求一致，通常为'failure'或'success'。请根据支付宝文档确认。
            }
            
        } catch (error) {
            console.error('❌ 支付宝异步通知处理异常:', error);
            res.set('Content-Type', 'text/plain');
            res.send('failure');
        }
    }
    
    /**
     * 微信支付异步通知回调
     * POST /api/payment/wechat/notify
     */
    async wechatNotify(req, res) {
        try {
            console.log('📩 收到微信支付异步通知:', req.body);
            
            const result = await paymentService.handlePaymentNotify('wechat', req.body);
            
            if (result.success) {
                console.log('✅ 微信支付通知处理成功');
                res.set('Content-Type', 'application/xml');
                res.send(`
                    <xml>
                        <return_code><![CDATA[SUCCESS]]></return_code>
                        <return_msg><![CDATA[OK]]></return_msg>
                    </xml>
                `);
            } else {
                console.error('❌ 微信支付通知处理失败:', result.message);
                res.set('Content-Type', 'application/xml');
                res.send(`
                    <xml>
                        <return_code><![CDATA[FAIL]]></return_code>
                        <return_msg><![CDATA[${result.message}]]></return_msg>
                    </xml>
                `);
            }
            
        } catch (error) {
            console.error('❌ 微信支付通知处理异常:', error);
            res.set('Content-Type', 'application/xml');
            res.send(`
                <xml>
                    <return_code><![CDATA[FAIL]]></return_code>
                    <return_msg><![CDATA[系统异常]]></return_msg>
                </xml>
            `);
        }
    }
    
    /**
     * 支付成功页面（用户同步回调）
     * GET /api/payment/success
     */
        async paymentSuccess(req, res) {
        try {
            console.log('🔄 支付宝同步回调 (用户返回):', req.query);
            const { out_trade_no, trade_no, total_amount } = req.query;
            
            if (!out_trade_no) {
                console.warn('⚠️ 同步回调缺少订单号');
                // 即使没有订单号，也引导用户到前端，由前端处理
                return res.redirect(`${process.env.FRONTEND_URL || 'https://www.giftbuybuy.cn'}/#page-payment-result?error=missing_order`);
            }
            
            console.log('🎉 支付同步回调:', { out_trade_no, trade_no, total_amount });
            
            // **关键变更**：同步回调不再尝试更新数据库状态。
            // 因为：1. 参数可能被篡改 2. 状态更新应由可靠的异步通知处理
            // 这里仅记录日志，并将用户引导至前端页面。
            
            // 可选：进行一个轻量的订单查询，仅用于日志和验证订单存在（不依赖支付宝SDK）
            const order = await orderModel.findById(out_trade_no);
            if (order) {
                console.log(`  订单存在，当前状态: ${order.status}`);
            } else {
                console.warn(`  警告：同步回调中的订单号在本地不存在: ${out_trade_no}`);
            }
            // 可选：验证签名
            const verifyResult = await paymentService.verifyAlipaySyncCallback(req.query);
            
            // 重定向到前端支付成功页面，由前端通过查询API确认最终状态
            const frontendBase = process.env.FRONTEND_URL || 'https://www.giftbuybuy.cn';
            const frontendUrl = `${frontendBase}/#page-payment-result?orderId=${encodeURIComponent(out_trade_no)}`;
            
            console.log('🔄 重定向到前端:', frontendUrl);
            res.redirect(frontendUrl);
            
        } catch (error) {
            console.error('❌ 支付成功页面处理异常:', error);
            // 发生异常时，仍尽量引导用户到前端
            res.redirect(`${process.env.FRONTEND_URL || 'https://www.giftbuybuy.cn'}/payment-error?reason=server_error`);
        }
    }
    // async paymentSuccess(req, res) {
    //     try {
    //         console.log('🔄 支付宝同步回调:', req.query);
    //         const { out_trade_no, trade_no, total_amount } = req.query;
            
    //         console.log('🎉 支付成功页面访问:', { out_trade_no, trade_no, total_amount });
            
    //         // 更新订单状态为已支付
    //         if (out_trade_no) {
    //             const order = await orderModel.findById(out_trade_no);
    //             if (order && order.status === 'unpaid') {
    //                 await orderModel.updateStatus(out_trade_no, 'paid');
    //                 console.log(`✅ 订单 ${out_trade_no} 状态已更新为paid`);
    //             }
    //         }
    //         else
    //         {
    //             return res.status(400).send('订单号缺失');
    //         }
           
    //         // 1. 验证签名（重要）
    //         const verifyResult = await alipayService.verifyNotify(req.query);
            
    //         if (!verifyResult.success) {
    //             console.error('❌ 同步回调签名验证失败:', verifyResult.message);
    //             return res.redirect('/payment-error?message=签名验证失败');
    //         }

    //         // 2. 更新订单状态
    //         await paymentService.updatePaymentStatus({
    //             orderId: out_trade_no,
    //             tradeNo: trade_no,
    //             amount: total_amount,
    //             status: 'paid'
    //         });

    //         // 返回支付成功页面
    //         res.send(`
    //             <!DOCTYPE html>
    //             <html lang="zh-CN">
    //             <head>
    //                 <meta charset="UTF-8">
    //                 <meta name="viewport" content="width=device-width, initial-scale=1.0">
    //                 <title>支付成功 - Gift Buy Buy</title>
    //                 <style>
    //                     * { margin: 0; padding: 0; box-sizing: border-box; }
    //                     body { font-family: 'Microsoft YaHei', sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center; }
    //                     .container { background: white; border-radius: 20px; padding: 40px; max-width: 500px; text-align: center; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
    //                     .success-icon { color: #52c41a; font-size: 80px; margin-bottom: 20px; }
    //                     h1 { color: #333; margin-bottom: 30px; }
    //                     .info-box { background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0; text-align: left; }
    //                     .info-row { margin: 10px 0; display: flex; }
    //                     .info-label { font-weight: bold; width: 100px; color: #666; }
    //                     .info-value { color: #333; }
    //                     .btn { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; border-radius: 25px; text-decoration: none; margin-top: 20px; transition: transform 0.3s; }
    //                     .btn:hover { transform: translateY(-2px); }
    //                 </style>
    //             </head>
    //             <body>
    //                 <div class="container">
    //                     <div class="success-icon">✅</div>
    //                     <h1>支付成功！</h1>
    //                     <p>感谢您的购买，您的订单已支付成功</p>
                        
    //                     <div class="info-box">
    //                         <div class="info-row">
    //                             <span class="info-label">订单号：</span>
    //                             <span class="info-value">${out_trade_no || 'N/A'}</span>
    //                         </div>
    //                         <div class="info-row">
    //                             <span class="info-label">交易号：</span>
    //                             <span class="info-value">${trade_no || 'N/A'}</span>
    //                         </div>
    //                         <div class="info-row">
    //                             <span class="info-label">支付金额：</span>
    //                             <span class="info-value">¥${total_amount || '0.00'}</span>
    //                         </div>
    //                         <div class="info-row">
    //                             <span class="info-label">支付时间：</span>
    //                             <span class="info-value">${new Date().toLocaleString('zh-CN')}</span>
    //                         </div>
    //                     </div>
                        
    //                     <p>我们已收到您的付款，礼品将尽快安排发货</p>
    //                     <p>您可以在"我的订单"中查看订单状态</p>
                        
    //                     <a href="${process.env.FRONTEND_URL || 'https://www.giftbuybuy.cn'}" class="btn">返回首页</a>
    //                     <a href="${process.env.FRONTEND_URL || 'https://www.giftbuybuy.cn'}/orders" class="btn" style="margin-left: 10px;">查看订单</a>
    //                 </div>
    //             </body>
    //             </html>
    //         `);
            
    //     } catch (error) {
    //         console.error('支付成功页面错误:', error);
    //         res.status(500).send(`
    //             <!DOCTYPE html>
    //             <html>
    //             <head><title>系统错误</title></head>
    //             <body>
    //                 <h1>系统错误</h1>
    //                 <p>支付成功页面加载失败，请稍后重试</p>
    //             </body>
    //             </html>
    //         `);
    //     }
    // }
}

module.exports = new PaymentController();