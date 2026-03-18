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
    async sendEmail(to, subject, html, text = '', cc = []) {
        if (!this.initialized) await this.initialize();

        try {
            console.log(`📤 通过 Resend API 发送邮件 -> ${to} ${cc.length > 0 ? `(抄送: ${cc.join(', ')})` : ''}`);

            const emailParams = {
                from: 'orders@giftbuybuy.cn',
                to: to,
                subject: subject,
                html: html,
                text: text
            };
            
            // 如果有抄送，加入cc参数
            if (cc && cc.length > 0) {
                emailParams.cc = cc;
            }

            const { data, error } = await resend.emails.send(emailParams);

            if (error) {
                console.error('❌ Resend API 返回错误:', error);
                throw new Error(`邮件发送失败: ${error.message}`);
            }

            console.log(`✅ 邮件发送成功! 邮件ID: ${data.id}`);
            return data;

        } catch (error) {
            console.error('❌ 发送邮件过程中出现异常:', error);
            throw error;
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
        const subject = `订单确认 - 订单号: ${order.orderId}`;
        
        // 从环境变量获取跟单员邮箱，用逗号分隔
        const ccEmails = process.env.ORDER_CC_EMAILS ? process.env.ORDER_CC_EMAILS.split(',') : [];
        
        // 解析寄件人和收件人信息（从订单数据中）
        const buyerInfo = order.buyerInfo || {};
        const recipientInfo = order.recipientInfo || {};
        
        // 🔥 修改：根据货币格式化价格显示
        let priceDisplay = '';
        let totalDisplay = '';
        if (order.currency === 'USD') {
            priceDisplay = `$${parseFloat(order.display_price || order.price).toFixed(2)}`;
            totalDisplay = `$${(parseFloat(order.display_price || order.price) * order.quantity).toFixed(2)}`;
        } else {
            priceDisplay = `¥${parseFloat(order.price).toFixed(2)}`;
            totalDisplay = `¥${(order.price * order.quantity).toFixed(2)}`;
        }

        // 构建收件人地址字符串
        let recipientAddress = '';
        if (recipientInfo.street || recipientInfo.city || recipientInfo.state || recipientInfo.zip || recipientInfo.country) {
            const addressParts = [];
            if (recipientInfo.street) addressParts.push(recipientInfo.street);
            if (recipientInfo.city) addressParts.push(recipientInfo.city);
            if (recipientInfo.state) addressParts.push(recipientInfo.state);
            if (recipientInfo.zip) addressParts.push(recipientInfo.zip);
            if (recipientInfo.country) {
                // 将国家代码转换为中文显示
                const countryMap = {
                    'china': '中国',
                    'usa': '美国',
                    'uk': '英国',
                    'germany': '德国',
                    'japan': '日本'
                };
                addressParts.push(countryMap[recipientInfo.country] || recipientInfo.country);
            }
            recipientAddress = addressParts.join('，');
        }
        
        const html = `
            <div style="font-family: 'Microsoft YaHei', Arial, sans-serif; max-width: 700px; margin: 0 auto; background: #f9f9f9; padding: 20px;">
                <div style="background: white; border-radius: 10px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <!-- 头部 -->
                    <div style="text-align: center; border-bottom: 2px solid #1890ff; padding-bottom: 20px; margin-bottom: 30px;">
                        <h1 style="color: #1890ff; margin: 0;">订单创建成功！</h1>
                        <p style="color: #666; font-size: 16px;">感谢您的购买，订单已确认</p>
                    </div>
                    
                    <!-- 订单基本信息 -->
                    <div style="margin-bottom: 30px;">
                        <h2 style="color: #333; border-left: 4px solid #1890ff; padding-left: 10px;">订单信息</h2>
                        <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                            <tr>
                                <td style="padding: 8px 0; color: #666; width: 120px;"><strong>订单编号：</strong></td>
                                <td style="padding: 8px 0; color: #333; font-weight: bold;">${order.orderId}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #666;"><strong>下单时间：</strong></td>
                                <td style="padding: 8px 0; color: #333;">${new Date().toLocaleString('zh-CN')}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #666;"><strong>订单状态：</strong></td>
                                <td style="padding: 8px 0;">
                                    <span style="background: #e6f7ff; color: #1890ff; padding: 3px 10px; border-radius: 4px; font-size: 12px;">
                                        ${order.status === 'unpaid' ? '待支付' : order.status}
                                    </span>
                                </td>
                            </tr>
                        </table>
                    </div>
                    
                    <!-- 商品信息 -->
                    <div style="margin-bottom: 30px;">
                        <h2 style="color: #333; border-left: 4px solid #52c41a; padding-left: 10px;">商品详情</h2>
                        <div style="background: #f6ffed; border: 1px solid #b7eb8f; border-radius: 6px; padding: 15px; margin-top: 15px;">
                            <table style="width: 100%;">
                                <tr>
                                    <td style="padding: 8px 0;"><strong>商品名称：</strong>${order.productName}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0;"><strong>单价：</strong>¥${parseFloat(order.price).toFixed(2)}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0;"><strong>数量：</strong>${order.quantity}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; border-top: 1px dashed #ddd; padding-top: 12px;">
                                        <strong style="font-size: 16px;">订单总额：</strong>
                                        <span style="color: #ff4d4f; font-size: 20px; font-weight: bold;">
                                            ${totalDisplay} ${order.currency === 'USD' ? '(美元)' : '(人民币)'} <!-- 🔥 修改这里 -->
                                        </span>
                                    </td>
                                </tr>
                            </table>
                        </div>
                    </div>
                    
                    <!-- 寄件人信息（买家） -->
                    <div style="margin-bottom: 30px;">
                        <h2 style="color: #333; border-left: 4px solid #722ed1; padding-left: 10px;">寄件人信息</h2>
                        <div style="background: #f9f0ff; border: 1px solid #d3adf7; border-radius: 6px; padding: 15px; margin-top: 15px;">
                            <table style="width: 100%;">
                                <tr>
                                    <td style="padding: 8px 0; width: 80px;"><strong>姓名：</strong></td>
                                    <td style="padding: 8px 0;">${buyerInfo.name || '未提供'}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0;"><strong>电话：</strong></td>
                                    <td style="padding: 8px 0;">${buyerInfo.phone || '未提供'}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0;"><strong>邮箱：</strong></td>
                                    <td style="padding: 8px 0;">${user.email}</td>
                                </tr>
                            </table>
                        </div>
                    </div>
                    
                    <!-- 收件人信息 -->
                    <div style="margin-bottom: 30px;">
                        <h2 style="color: #333; border-left: 4px solid #fa8c16; padding-left: 10px;">收件人信息</h2>
                        <div style="background: #fff7e6; border: 1px solid #ffd591; border-radius: 6px; padding: 15px; margin-top: 15px;">
                            <table style="width: 100%;">
                                <tr>
                                    <td style="padding: 8px 0; width: 80px;"><strong>姓名：</strong></td>
                                    <td style="padding: 8px 0;">${recipientInfo.name || '未提供'}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0;"><strong>电话：</strong></td>
                                    <td style="padding: 8px 0;">${recipientInfo.phone || '未提供'}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; vertical-align: top;"><strong>地址：</strong></td>
                                    <td style="padding: 8px 0;">
                                        ${recipientAddress || '未提供'}
                                    </td>
                                </tr>
                            </table>
                        </div>
                    </div>
                    
                    <!-- 贺卡信息 -->
                    ${order.giftMessage ? `
                    <div style="margin-bottom: 30px;">
                        <h2 style="color: #333; border-left: 4px solid #13c2c2; padding-left: 10px;">礼品祝福</h2>
                        <div style="background: #e6fffb; border: 1px solid #87e8de; border-radius: 6px; padding: 20px; margin-top: 15px;">
                            <p style="font-style: italic; color: #08979c; font-size: 16px; line-height: 1.6; margin: 0;">
                                "${order.giftMessage}"
                            </p>
                            ${order.giftMessage.length > 180 ? `
                            <p style="color: #ff4d4f; font-size: 12px; margin-top: 10px;">
                                ※ 注意：祝福语超过180字符限制，已截断显示
                            </p>` : ''}
                        </div>
                    </div>` : ''}
                    
                    <!-- 跟单员信息 -->
                    ${ccEmails.length > 0 ? `
                    <div style="margin-bottom: 30px;">
                        <h2 style="color: #333; border-left: 4px solid #f5222d; padding-left: 10px;">订单服务</h2>
                        <div style="background: #fff1f0; border: 1px solid #ffa39e; border-radius: 6px; padding: 15px; margin-top: 15px;">
                            <p style="margin: 0 0 10px 0;">您的订单已分配专属跟单员，如需修改订单信息或咨询物流状态，可直接联系：</p>
                            <ul style="margin: 10px 0; padding-left: 20px;">
                                ${ccEmails.map(email => `<li style="margin-bottom: 5px;"><strong>跟单员邮箱：</strong>${email.trim()}</li>`).join('')}
                            </ul>
                            <p style="margin: 10px 0 0 0; color: #666; font-size: 14px;">
                                ※ 邮件抄送已发送给跟单员，他们将主动跟进您的订单需求。
                            </p>
                        </div>
                    </div>` : ''}
                    
                    <!-- 底部 -->
                    <div style="border-top: 2px dashed #eee; padding-top: 20px; margin-top: 30px; text-align: center;">
                        <p style="color: #999; font-size: 14px; margin: 5px 0;">
                            您也可以登录网站查看订单详情和物流状态
                        </p>
                        <p style="color: #ccc; font-size: 12px; margin: 10px 0 0 0;">
                            此邮件由系统自动发送，请勿直接回复。
                        </p>
                    </div>
                </div>
            </div>
        `;
        
        // 纯文本版本（备用）
        const text = `
            订单确认 - 订单号: ${order.orderId}

            订单信息：
            - 订单编号：${order.orderId}
            - 下单时间：${new Date().toLocaleString('zh-CN')}
            - 订单状态：${order.status === 'unpaid' ? '待支付' : order.status}

            商品详情：
            - 商品名称：${order.productName}
            - 单价：¥${parseFloat(order.price).toFixed(2)}
            - 数量：${order.quantity}
            - 订单总额：¥${(order.price * order.quantity).toFixed(2)}

            寄件人信息：
            - 姓名：${buyerInfo.name || '未提供'}
            - 电话：${buyerInfo.phone || '未提供'}
            - 邮箱：${user.email}

            收件人信息：
            - 姓名：${recipientInfo.name || '未提供'}
            - 电话：${recipientInfo.phone || '未提供'}
            - 地址：${recipientAddress || '未提供'}

            ${order.giftMessage ? `贺卡祝福：${order.giftMessage}` : ''}

            ${ccEmails.length > 0 ? `
            订单服务：
            您的订单已分配专属跟单员，如需修改订单信息或咨询物流状态，可直接联系：
            ${ccEmails.map(email => `- 跟单员邮箱：${email.trim()}`).join('\n')}
            ` : ''}
        `;

        // 准备邮件参数
        const emailParams = {
            from: 'orders@giftbuybuy.cn', // 使用您的域名邮箱
            to: user.email,
            subject: subject,
            html: html,
            text: text
        };
        
        // 如果配置了抄送邮箱，则加入cc参数
        if (ccEmails.length > 0) {
            emailParams.cc = ccEmails.map(email => email.trim()).filter(email => email);
        }

        return await this.sendEmail(user.email, subject, html, text, ccEmails.length > 0 ? ccEmails : undefined);
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

    /**
     * 发送联系表单邮件
     * @param {Object} contactData - 联系表单数据
     * @param {string} contactData.name - 用户姓名
     * @param {string} contactData.email - 用户邮箱
     * @param {string} contactData.phone - 用户电话（可选）
     * @param {string} contactData.subject - 消息主题
     * @param {string} contactData.message - 消息内容
     */
    async sendContactFormEmail(contactData) {
        const { name, email, phone, subject, message } = contactData;
        
        // 收件人邮箱 - 从环境变量获取，默认为客服邮箱
        const toEmail = process.env.CONTACT_FORM_EMAIL || 'service@giftbuybuy.cn';
        
        const emailSubject = `【网站留言】${subject} - 来自 ${name}`;
        
        const htmlContent = `
            <div style="font-family: 'Microsoft YaHei', Arial, sans-serif; max-width: 700px; margin: 0 auto; background: #f9f9f9; padding: 20px;">
                <div style="background: white; border-radius: 10px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <!-- 头部 -->
                    <div style="text-align: center; border-bottom: 2px solid #d4af37; padding-bottom: 20px; margin-bottom: 30px;">
                        <h1 style="color: #d4af37; margin: 0;">🎁 Gift Buy Buy</h1>
                        <p style="color: #666; font-size: 16px;">收到新的客户留言</p>
                    </div>
                    
                    <!-- 客户信息 -->
                    <div style="margin-bottom: 30px;">
                        <h2 style="color: #333; border-left: 4px solid #d4af37; padding-left: 10px;">客户信息</h2>
                        <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                            <tr>
                                <td style="padding: 8px 0; color: #666; width: 100px;"><strong>姓名：</strong></td>
                                <td style="padding: 8px 0; color: #333;">${name}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #666;"><strong>邮箱：</strong></td>
                                <td style="padding: 8px 0; color: #333;">
                                    <a href="mailto:${email}" style="color: #1890ff; text-decoration: none;">${email}</a>
                                </td>
                            </tr>
                            ${phone ? `
                            <tr>
                                <td style="padding: 8px 0; color: #666;"><strong>电话：</strong></td>
                                <td style="padding: 8px 0; color: #333;">${phone}</td>
                            </tr>
                            ` : ''}
                            <tr>
                                <td style="padding: 8px 0; color: #666;"><strong>提交时间：</strong></td>
                                <td style="padding: 8px 0; color: #333;">${new Date().toLocaleString('zh-CN')}</td>
                            </tr>
                        </table>
                    </div>
                    
                    <!-- 消息内容 -->
                    <div style="margin-bottom: 30px;">
                        <h2 style="color: #333; border-left: 4px solid #52c41a; padding-left: 10px;">消息主题</h2>
                        <div style="background: #f6ffed; border: 1px solid #b7eb8f; border-radius: 6px; padding: 15px; margin-top: 15px;">
                            <p style="margin: 0; color: #333; font-weight: bold;">${subject}</p>
                        </div>
                    </div>
                    
                    <div style="margin-bottom: 30px;">
                        <h2 style="color: #333; border-left: 4px solid #1890ff; padding-left: 10px;">消息内容</h2>
                        <div style="background: #e6f7ff; border: 1px solid #91d5ff; border-radius: 6px; padding: 20px; margin-top: 15px;">
                            <p style="margin: 0; color: #333; line-height: 1.8; white-space: pre-wrap;">${message.replace(/\n/g, '<br>')}</p>
                        </div>
                    </div>
                    
                    <!-- 操作提示 -->
                    <div style="background: #fff7e6; border: 1px solid #ffd591; border-radius: 6px; padding: 15px; margin-top: 20px;">
                        <p style="margin: 0; color: #666; font-size: 14px;">
                            <strong>💡 提示：</strong>您可以直接回复此邮件与客户取得联系，或点击客户邮箱地址发送邮件。
                        </p>
                    </div>
                    
                    <!-- 底部 -->
                    <div style="border-top: 2px dashed #eee; padding-top: 20px; margin-top: 30px; text-align: center;">
                        <p style="color: #ccc; font-size: 12px; margin: 10px 0 0 0;">
                            此邮件由 Gift Buy Buy 网站联系表单自动生成<br>
                            发送时间：${new Date().toLocaleString('zh-CN')}
                        </p>
                    </div>
                </div>
            </div>
        `;

        const textContent = `
【Gift Buy Buy 网站留言】

客户信息：
- 姓名：${name}
- 邮箱：${email}
${phone ? `- 电话：${phone}` : ''}
- 提交时间：${new Date().toLocaleString('zh-CN')}

消息主题：${subject}

消息内容：
${message}

---
此邮件由 Gift Buy Buy 网站联系表单自动生成
        `;

        return await this.sendEmail(toEmail, emailSubject, htmlContent, textContent);
    }

}

// 导出单例实例
const resendEmailService = new ResendEmailService();
module.exports = resendEmailService;