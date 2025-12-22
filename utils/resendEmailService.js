// utils/resendEmailService.js
const { Resend } = require('resend');

// 初始化 Resend 客户端，API Key 从环境变量获取
const resend = new Resend(process.env.RESEND_API_KEY);

class ResendEmailService {
    constructor() {
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return;
        // 简单的初始化检查，实际连接测试在发送时进行
        if (!process.env.RESEND_API_KEY) {
            throw new Error('RESEND_API_KEY 环境变量未设置。请从 Resend 后台获取。');
        }
        this.initialized = true;
        console.log('✅ Resend 邮件服务初始化完成');
    }

    /**
     * 发送邮件核心方法
     */
    async sendEmail(to, subject, html, text = '') {
        if (!this.initialized) await this.initialize();

        try {
            console.log(`📤 通过 Resend API 发送邮件 -> ${to}`);

            const { data, error } = await resend.emails.send({
                // from: 建议使用您在 Resend 验证过的域名邮箱，例如：newsletter@yourdomain.com
                // 测试阶段可暂时使用 Resend 提供的测试域名
                from: 'onboarding@resend.dev', 
                to: to,
                subject: subject,
                html: html,
                text: text, // 纯文本版本，可选
            });

            if (error) {
                console.error('❌ Resend API 返回错误:', error);
                throw new Error(`邮件发送失败: ${error.message}`);
            }

            console.log(`✅ 邮件发送成功! 邮件ID: ${data.id}`);
            return data;

        } catch (error) {
            console.error('❌ 发送邮件过程中出现异常:', error);
            throw error; // 将错误抛给上层调用者处理
        }
    }

    /**
     * 发送验证码邮件
     */
    async sendVerificationCodeEmail(userEmail, verificationCode) {
        const subject = '请验证您的邮箱 - 礼品商城';
        const htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #d4af37;">邮箱验证码</h2>
                <p>尊敬的客户，</p>
                <p>您正在进行的操作需要验证邮箱，验证码为：</p>
                <div style="text-align: center; margin: 30px 0;">
                    <span style="font-size: 32px; font-weight: bold; color: #d4af37; letter-spacing: 8px; padding: 15px 30px; border: 2px dashed #d4af37; border-radius: 8px; background: #fffaf0;">
                        ${verificationCode}
                    </span>
                </div>
                <p><strong>有效期：</strong>10分钟</p>
                <p>如非本人操作，请忽略此邮件。</p>
            </div>
        `;

        return await this.sendEmail(userEmail, subject, htmlContent);
    }

    // 发送欢迎邮件
    async sendWelcomeEmail(user) {
        const subject = '欢迎加入礼品电商平台！';
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #1890ff;">欢迎加入礼品电商平台！</h2>
                <p>亲爱的 ${user.username || user.email}，</p>
                <p>感谢您注册我们的礼品电商平台！您现在可以：</p>
                <ul>
                    <li>浏览和购买精美礼品</li>
                    <li>管理您的订单</li>
                    <li>查看订单状态</li>
                </ul>
                <p>如果您有任何问题，请随时联系我们。</p>
                <hr>
                <p style="color: #666; font-size: 12px;">
                    此邮件由系统自动发送，请勿回复。
                </p>
            </div>
        `;

        return await this.sendEmail(user.email, subject, html);
    }

    // 发送订单确认邮件
    async sendOrderConfirmationEmail(user, order) {
        const subject = `订单确认 - ${order.orderId}`;
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #52c41a;">订单创建成功！</h2>
                <p>亲爱的 ${user.username || user.email}，</p>
                <p>您的订单已成功创建，订单详情如下：</p>
                
                <div style="background: #f5f5f5; padding: 15px; border-radius: 5px;">
                    <h3>订单信息</h3>
                    <p><strong>订单号:</strong> ${order.orderId}</p>
                    <p><strong>产品:</strong> ${order.productName}</p>
                    <p><strong>数量:</strong> ${order.quantity}</p>
                    <p><strong>总价:</strong> ¥${(order.price * order.quantity).toFixed(2)}</p>
                    <p><strong>状态:</strong> ${order.status}</p>
                </div>
                
                <p>您可以在用户中心查看订单状态和更新。</p>
                <hr>
                <p style="color: #666; font-size: 12px;">
                    此邮件由系统自动发送，请勿回复。
                </p>
            </div>
        `;

        return await this.sendEmail(user.email, subject, html);
    }

    // 发送密码重置邮件
    async sendPasswordResetEmail(user, resetToken) {
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
        const subject = '密码重置请求';
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #ff4d4f;">密码重置</h2>
                <p>亲爱的 ${user.username || user.email}，</p>
                <p>我们收到了您的密码重置请求。请点击下面的链接重置密码：</p>
                <p>
                    <a href="${resetUrl}" 
                       style="background: #1890ff; color: white; padding: 10px 20px; 
                              text-decoration: none; border-radius: 4px; display: inline-block;">
                        重置密码
                    </a>
                </p>
                <p>如果链接无效，请复制以下地址到浏览器：</p>
                <p style="color: #666; font-size: 12px;">${resetUrl}</p>
                <p>此链接将在1小时后过期。</p>
                <hr>
                <p style="color: #666; font-size: 12px;">
                    如果您没有请求重置密码，请忽略此邮件。
                </p>
            </div>
        `;

        return await this.sendEmail(user.email, subject, html);
    }
    
    // 发送验证码邮件
    async sendVerificationCodeEmail(user, verificationCode) {
        const subject = '密码重置验证码';
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #1890ff;">密码重置验证码</h2>
                <p>亲爱的 ${user.username || user.email}，</p>
                <p>您正在尝试重置密码，验证码为：</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <span style="font-size: 32px; font-weight: bold; color: #1890ff; 
                          letter-spacing: 5px; padding: 10px 20px; 
                          border: 2px dashed #1890ff; border-radius: 5px;">
                        ${verificationCode}
                    </span>
                </div>
                
                <p><strong>有效期：</strong>10分钟</p>
                <p><strong>安全提示：</strong></p>
                <ul>
                    <li>请勿将验证码透露给他人</li>
                    <li>如非本人操作，请忽略此邮件</li>
                    <li>验证码尝试次数限制为3次</li>
                </ul>
                <hr>
                <p style="color: #666; font-size: 12px;">
                    此邮件由系统自动发送，请勿回复。
                </p>
            </div>
        `;
        
        const text = `密码重置验证码：${verificationCode}，有效期10分钟。如非本人操作，请忽略。`;

        return await this.sendEmail(user.email, subject, html, text);
    }
    
    // 发送密码重置成功邮件
    async sendPasswordResetSuccessEmail(user) {
        const subject = '密码重置成功通知';
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #52c41a;">密码重置成功</h2>
                <p>亲爱的 ${user.username || user.email}，</p>
                <p>您的账号密码已成功重置。</p>
                
                <div style="background: #f6ffed; border: 1px solid #b7eb8f; 
                      padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p>✅ 密码重置操作已完成</p>
                    <p>🕒 操作时间：${new Date().toLocaleString('zh-CN')}</p>
                </div>
                
                <p><strong>安全提示：</strong></p>
                <ul>
                    <li>请使用新密码登录您的账户</li>
                    <li>建议定期更换密码以保证账户安全</li>
                    <li>如非本人操作，请立即联系客服</li>
                </ul>
                <hr>
                <p style="color: #666; font-size: 12px;">
                    此邮件由系统自动发送，请勿回复。
                </p>
            </div>
        `;

        return await this.sendEmail(user.email, subject, html);
    }

}

// 导出单例实例
const resendEmailService = new ResendEmailService();
module.exports = resendEmailService;