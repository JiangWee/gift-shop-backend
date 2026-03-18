const resendEmailService = require('../services/resendEmailService');

class ContactController {
    /**
     * 处理联系表单提交 - 发送邮件通知
     */
    async sendContactMessage(req, res) {
        try {
            const { name, email, phone, subject, message } = req.body;

            console.log('📨 收到联系表单提交:', {
                name,
                email,
                phone: phone || '未提供',
                subject,
                messageLength: message?.length
            });

            // 调用邮件服务发送联系表单邮件
            const result = await resendEmailService.sendContactFormEmail({
                name,
                email,
                phone,
                subject,
                message
            });

            console.log('✅ 联系表单邮件发送成功:', result);

            res.status(200).json({
                success: true,
                message: '消息发送成功，我们会尽快回复您',
                data: {
                    emailId: result.id,
                    sentAt: new Date().toISOString()
                }
            });

        } catch (error) {
            console.error('❌ 发送联系表单邮件失败:', error);
            
            res.status(500).json({
                success: false,
                message: '消息发送失败，请稍后重试',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
}

module.exports = new ContactController();
