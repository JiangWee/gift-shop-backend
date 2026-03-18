const resendEmailService = require('../services/resendEmailService');

class MedicalController {
    /**
     * 处理医疗咨询表单提交
     */
    async submitInquiry(req, res) {
        try {
            const {
                firstName,
                lastName,
                email,
                phone,
                country,
                dateOfBirth,
                serviceType,
                conditions,
                medicalHistory,
                preferredDate,
                duration,
                groupSize,
                accommodation,
                specialRequests
            } = req.body;

            console.log('📨 收到医疗咨询表单提交:', {
                name: `${firstName} ${lastName}`,
                email,
                phone,
                country,
                serviceType
            });

            // 验证必填字段
            if (!firstName || !lastName || !email || !phone || !country || !serviceType) {
                return res.status(400).json({
                    success: false,
                    message: 'Please fill in all required fields'
                });
            }

            // 发送邮件通知
            const result = await resendEmailService.sendMedicalInquiryEmail({
                firstName,
                lastName,
                email,
                phone,
                country,
                dateOfBirth,
                serviceType,
                conditions: conditions || [],
                medicalHistory,
                preferredDate,
                duration,
                groupSize,
                accommodation,
                specialRequests
            });

            console.log('✅ 医疗咨询邮件发送成功:', result);

            res.status(200).json({
                success: true,
                message: 'Thank you for your inquiry! We will contact you within 24 hours.',
                data: {
                    emailId: result.id,
                    submittedAt: new Date().toISOString()
                }
            });

        } catch (error) {
            console.error('❌ 医疗咨询表单提交失败:', error);
            
            res.status(500).json({
                success: false,
                message: 'Failed to submit inquiry. Please try again later.',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
}

module.exports = new MedicalController();
