// scripts/test-password-reset.js
require('dotenv').config();
const axios = require('axios');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000/api/auth';

async function testPasswordReset() {
    console.log('🧪 测试密码重置流程...\n');
    
    const testEmail = 'test@example.com'; // 替换为实际测试邮箱
    
    try {
        // 1. 发送验证码
        console.log('1. 发送验证码...');
        const sendResponse = await axios.post(`${BASE_URL}/forgot-password/send-code`, {
            email: testEmail
        });
        console.log('✅ 发送验证码成功:', sendResponse.data);
        
        // 如果是开发环境，可能直接返回验证码
        const verificationCode = sendResponse.data.data?.verificationCode;
        
        if (verificationCode) {
            console.log(`📋 验证码: ${verificationCode}`);
            
            // 2. 验证验证码
            console.log('\n2. 验证验证码...');
            const verifyResponse = await axios.post(`${BASE_URL}/forgot-password/verify-code`, {
                email: testEmail,
                code: verificationCode
            });
            console.log('✅ 验证验证码成功:', verifyResponse.data);
            
            const resetToken = verifyResponse.data.data.resetToken;
            
            // 3. 重置密码
            console.log('\n3. 重置密码...');
            const resetResponse = await axios.post(`${BASE_URL}/forgot-password/reset`, {
                resetToken: resetToken,
                newPassword: 'NewPassword123'
            });
            console.log('✅ 重置密码成功:', resetResponse.data);
            
        } else {
            console.log('📧 请检查邮箱获取验证码后手动测试后续步骤');
        }
        
    } catch (error) {
        console.error('❌ 测试失败:', error.response?.data || error.message);
    }
}

testPasswordReset();