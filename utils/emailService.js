// utils/emailService.js - 添加验证码邮件方法
const nodemailer = require('nodemailer');

class EmailService {
    constructor() {
        this.transporter = null;
        this.isInitialized = false;
        this.maxRetries = 3; // 发送邮件最大重试次数
        this.retryDelay = 2000; // 重试延迟(毫秒)
    }

    /**
     * 初始化邮件服务
     */
    async initialize() {
        if (this.isInitialized) {
            console.log('✅ 邮件服务已初始化');
            return;
        }

        try {
            console.log('🔄 开始初始化邮件服务...');
            
            // 验证必要的环境变量
            this.validateEmailConfig();
            
            if (process.env.EMAIL_SERVICE === 'gmail') {
                await this.initializeGmail();
            } else {
                await this.initializeTestAccount();
            }
            
            this.isInitialized = true;
            console.log('✅ 邮件服务初始化完成');
            
        } catch (error) {
            console.error('❌ 邮件服务初始化失败:', error.message);
            // 即使初始化失败，也设置一个基础的transport避免应用崩溃
            await this.initializeFallback();
            throw error;
        }
    }

    /**
     * 验证邮件配置
     */
    validateEmailConfig() {
        const required = ['EMAIL_USER', 'EMAIL_PASSWORD'];
        const missing = required.filter(key => !process.env[key]);
        
        if (missing.length > 0) {
            throw new Error(`缺少必要的环境变量: ${missing.join(', ')}`);
        }

        console.log('🔍 环境变量检查:');
        console.log('   EMAIL_USER:', process.env.EMAIL_USER ? '已设置' : '未设置');
        console.log('   EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '已设置' : '未设置');
        console.log('   EMAIL_SERVICE:', process.env.EMAIL_SERVICE || '未设置(将使用测试账户)');
    }

    /**
     * 初始化Gmail配置
     */
    async initializeGmail() {
        console.log('📧 配置Gmail SMTP...');
        
        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            host: 'smtp.gmail.com',
            port: 587, // 推荐使用587端口(TLS)
            secure: false, // 587端口使用STARTTLS，secure应为false
            requireTLS: true, // 要求使用TLS
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD, // 应该是应用专用密码
            },
            connectionTimeout: 15000, // 15秒连接超时
            greetingTimeout: 10000,   // 10秒问候超时
            socketTimeout: 30000,     // 30秒socket超时
            logger: true, // 启用详细日志
            debug: process.env.NODE_ENV === 'development', // 开发环境开启调试
        });

        // 验证连接配置
        await this.verifyConnection();
    }

    /**
     * 初始化测试账户(Ethereal Email)
     */
    async initializeTestAccount() {
        console.log('🧪 创建测试邮箱账户...');
        
        try {
            // 使用Ethereal Email进行测试
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

            console.log('📧 测试邮箱账户信息:');
            console.log('   用户名:', testAccount.user);
            console.log('   密码:', testAccount.pass);
            console.log('   Web界面: https://ethereal.email/');

        } catch (error) {
            console.error('❌ 创建测试账户失败:', error);
            throw error;
        }
    }

    /**
     * 备用初始化方案
     */
    async initializeFallback() {
        console.log('🛡️ 使用备用邮件配置...');
        
        this.transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD,
            },
            connectionTimeout: 10000,
        });
    }

    /**
     * 验证SMTP连接
     */
    async verifyConnection() {
        try {
            console.log('🔍 验证SMTP服务器连接...');
            await this.transporter.verify();
            console.log('✅ SMTP服务器连接验证成功');
        } catch (error) {
            console.error('❌ SMTP服务器连接验证失败:', error.message);
            throw new Error(`SMTP连接失败: ${error.message}`);
        }
    }

    /**
     * 发送邮件（带重试机制）
     */
    async sendEmail(to, subject, html, text = '', retries = this.maxRetries) {
        // 确保服务已初始化
        if (!this.isInitialized) {
            await this.initialize();
        }

        if (!this.transporter) {
            throw new Error('邮件服务未正确配置');
        }

        const mailOptions = {
            from: process.env.EMAIL_FROM || `"礼品商城" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            text: text || this.htmlToText(html), // 如果没有提供纯文本，从HTML转换
            html,
            // 添加重要邮件头
            headers: {
                'X-Priority': '1',
                'X-Mailer': 'NodeMailer 1.0',
            }
        };

        // 调试信息
        if (process.env.NODE_ENV === 'development') {
            console.log('📤 发送邮件详情:', {
                to,
                subject,
                hasHtml: !!html,
                retriesLeft: retries
            });
        }

        try {
            const info = await this.transporter.sendMail(mailOptions);
            
            // 开发环境下显示测试信息
            if (process.env.NODE_ENV === 'development' && !process.env.EMAIL_SERVICE) {
                console.log('📧 测试邮件已发送:');
                console.log('   预览URL:', nodemailer.getTestMessageUrl(info));
                console.log('   消息ID:', info.messageId);
            }

            console.log(`✅ 邮件发送成功: ${subject} -> ${to}`);
            return info;

        } catch (error) {
            console.error(`❌ 邮件发送失败 (${retries}次重试剩余):`, error.message);

            if (retries > 0) {
                console.log(`🔄 ${this.retryDelay/1000}秒后重试...`);
                await this.delay(this.retryDelay);
                return this.sendEmail(to, subject, html, text, retries - 1);
            }

            // 最终失败，抛出详细错误
            const enhancedError = new Error(`邮件发送失败: ${error.message}`);
            enhancedError.originalError = error;
            enhancedError.mailOptions = { to, subject };
            throw enhancedError;
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

    /**
     * 工具函数：HTML转纯文本
     */
    htmlToText(html) {
        return html
            .replace(/<[^>]*>/g, '') // 移除HTML标签
            .replace(/\s+/g, ' ')     // 合并空白字符
            .trim();
    }

    /**
     * 工具函数：延迟执行
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 获取服务状态（用于健康检查）
     */
    getStatus() {
        return {
            initialized: this.isInitialized,
            hasTransporter: !!this.transporter,
            timestamp: new Date().toISOString()
        };
    }
}

// 创建单例实例
const emailService = new EmailService();

// 添加全局错误处理
process.on('unhandledRejection', (error) => {
    if (error.originalError && error.mailOptions) {
        console.error('💥 未处理的邮件发送错误:', {
            to: error.mailOptions.to,
            subject: error.mailOptions.subject,
            error: error.originalError.message
        });
    }
});

module.exports = emailService;