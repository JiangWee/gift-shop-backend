const resendEmailService = require('../services/resendEmailService');

class GiftBagController {
    /**
     * 处理礼品袋B2B联系表单提交 - 发送邮件通知
     */
    async sendInquiry(req, res) {
        try {
            const { name, email, phone, subject, message, company, quantity } = req.body;

            console.log('🎁 收到礼品袋网站询盘:', {
                name,
                email,
                phone: phone || '未提供',
                company: company || '未提供',
                quantity: quantity || '未指定',
                subject,
                messageLength: message?.length
            });

            // 调用邮件服务发送邮件
            const result = await resendEmailService.sendContactFormEmail({
                name,
                email,
                phone,
                subject: `[GiftBuyBuy B2B] ${subject || 'Website Inquiry'}`,
                message: `
                    <h2>🎁 礼品袋网站 B2B 询盘</h2>
                    <p><strong>姓名:</strong> ${name}</p>
                    <p><strong>邮箱:</strong> ${email}</p>
                    <p><strong>电话:</strong> ${phone || '未提供'}</p>
                    <p><strong>公司:</strong> ${company || '未提供'}</p>
                    <p><strong>数量需求:</strong> ${quantity || '未指定'}</p>
                    <p><strong>主题:</strong> ${subject || 'Website Inquiry'}</p>
                    <hr>
                    <p><strong>留言内容:</strong></p>
                    <p>${message}</p>
                    <hr>
                    <p><small>来自: www.giftbuybuy.com</small></p>
                `
            });

            console.log('✅ 礼品袋询盘邮件发送成功:', result);

            res.status(200).json({
                success: true,
                message: 'Thank you! Your inquiry has been sent. We will get back to you within 24 hours.',
                data: {
                    emailId: result.id,
                    sentAt: new Date().toISOString()
                }
            });

        } catch (error) {
            console.error('❌ 发送礼品袋询盘邮件失败:', error);
            
            res.status(500).json({
                success: false,
                message: 'Failed to send inquiry. Please try again later.',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
}

module.exports = new GiftBagController();
