// utils/emailService.js - 添加验证码邮件方法
const nodemailer = require('nodemailer');

class EmailService {
    constructor() {
        this.transporter = null;
        this.init();
    }
    
    init() {
        try {
            if (process.env.EMAIL_SERVICE === 'gmail') {
                this.transporter = nodemailer.createTransport({
                    service: 'gmail',
                    // 使用587端口替代465，更可靠
                    port: 587,
                    secure: false, // 587端口使用TLS，不是SSL
                    auth: {
                        user: process.env.EMAIL_USER,
                        pass: process.env.EMAIL_PASSWORD,
                    },
                    // 增加超时设置
                    connectionTimeout: 10000, // 10秒连接超时
                    greetingTimeout: 10000,   // 10秒问候超时
                    socketTimeout: 10000,     // 10秒socket超时
                });
            }
            // 使用Ethereal邮箱（测试用）
            else {
                console.warn('⚠️ 使用测试邮箱服务，生产环境请配置真实邮箱');
                this.createTestAccount();
            }

            console.log('✅ 邮件服务初始化完成');
        } catch (error) {
            console.error('❌ 邮件服务初始化失败:', error);
        }
    }

    async createTestAccount() {
        const testAccount = await nodemailer.createTestAccount();
        this.transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass,
            },
        });
        console.log('📧 测试邮箱账户:', testAccount.user);
    }

    async sendEmail(to, subject, html, text = '') {
        if (!this.transporter) {
            throw new Error('邮件服务未配置');
        }

        try {
            const mailOptions = {
                from: process.env.EMAIL_FROM || '"礼品电商" <noreply@giftshop.com>',
                to,
                subject,
                text,
                html,
            };

            const info = await this.transporter.sendMail(mailOptions);
            
            if (process.env.NODE_ENV === 'development') {
                console.log('📧 邮件发送预览:', nodemailer.getTestMessageUrl(info));
            }
            
            console.log('✅ 邮件发送成功:', info.messageId);
            return info;
        } catch (error) {
            console.error('❌ 邮件发送失败:', error);
            throw error;
        }
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

module.exports = new EmailService();