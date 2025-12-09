// scripts/test-api.js
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
let registeredUser = null; // 保存注册用户信息

async function testHealthCheck() {
    try {
        console.log('🧪 测试健康检查...');
        const response = await axios.get(`${BASE_URL}/api/health`);
        console.log('✅ 健康检查测试通过:', response.data);
        return true;
    } catch (error) {
        console.error('❌ 健康检查测试失败:', error.message);
        return false;
    }
}

async function testUserRegistration() {
    try {
        console.log('🧪 测试用户注册...');
        
        const userData = {
            email: `test${Date.now()}@example.com`,
            phone: `1380013${String(Date.now()).slice(-4)}`,
            password: 'Test123456!',
            confirm: 'Test123456!',
            username: `testuser${Date.now()}`
        };
        
        console.log('📤 发送注册数据:', JSON.stringify(userData, null, 2));
        
        const response = await axios.post(`${BASE_URL}/api/auth/register`, userData);
        
        if (response.data.success) {
            console.log('✅ 用户注册测试通过');
            console.log('   响应数据:', JSON.stringify(response.data, null, 2));
            
            // 保存注册用户信息用于后续测试
            registeredUser = {
                email: userData.email,
                password: userData.password,
                id: response.data.data.user.id
            };
            
            return true;
        } else {
            console.error('❌ 注册失败:', response.data.message);
            return false;
        }
    } catch (error) {
        console.error('❌ 用户注册测试失败:');
        if (error.response) {
            console.error('   状态码:', error.response.status);
            console.error('   错误信息:', error.response.data?.message);
            if (error.response.data?.errors) {
                console.error('   验证错误详情:');
                error.response.data.errors.forEach(err => {
                    console.error(`     - ${err.field || '未知字段'}: ${err.message}`);
                });
            }
        } else {
            console.error('   网络错误:', error.message);
        }
        return false;
    }
}

async function testLogin() {
    try {
        console.log('🧪 测试用户登录...');
        
        if (!registeredUser) {
            console.log('⚠️ 没有注册用户信息，跳过登录测试');
            return null;
        }
        
        const loginData = {
            identifier: registeredUser.email,
            password: registeredUser.password
        };
        
        console.log('📤 发送登录数据:', JSON.stringify(loginData, null, 2));
        
        const response = await axios.post(`${BASE_URL}/api/auth/login`, loginData);
        
        if (response.data.success) {
            console.log('✅ 用户登录测试通过');
            console.log('   令牌:', response.data.data.accessToken ? '已获取' : '未获取');
            return response.data.data.accessToken;
        } else {
            console.error('❌ 登录失败:', response.data.message);
            return null;
        }
    } catch (error) {
        console.error('❌ 用户登录测试失败:');
        if (error.response) {
            console.error('   状态码:', error.response.status);
            console.error('   错误信息:', error.response.data?.message);
            if (error.response.data?.errors) {
                console.error('   验证错误详情:');
                error.response.data.errors.forEach(err => {
                    console.error(`     - ${err.field || '未知字段'}: ${err.message}`);
                });
            }
        } else {
            console.error('   网络错误:', error.message);
        }
        return null;
    }
}

async function testOrderCreation(token) {
    try {
        console.log('🧪 测试订单创建...');
        
        if (!token) {
            console.log('⚠️ 没有有效的token，跳过订单测试');
            return false;
        }

        const orderData = {
            product_id: 'prod_001',
            product_name: '测试礼品',
            price: 99.99,
            quantity: 1,
            buyer_info: {
                name: '测试买家',
                phone: '13800138000',
                email: 'buyer@example.com'
            },
            recipient_info: {
                name: '测试收件人',
                phone: '13900139000',
                address: {
                    street: '测试街道',
                    city: '测试城市',
                    state: '测试省',
                    zip: '100000',
                    country: '中国'
                }
            },
            gift_message: '这是一个测试订单的留言',
            delivery_date: '2024-12-31'
        };
        
        console.log('📤 发送订单数据:', JSON.stringify(orderData, null, 2));
        
        const response = await axios.post(`${BASE_URL}/api/orders`, orderData, {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.data.success) {
            console.log('✅ 订单创建测试通过');
            console.log('   订单ID:', response.data.data?.orderId);
            return true;
        } else {
            console.error('❌ 订单创建失败:', response.data.message);
            return false;
        }
    } catch (error) {
        console.error('❌ 订单创建测试失败:');
        if (error.response) {
            console.error('   状态码:', error.response.status);
            console.error('   错误信息:', error.response.data?.message);
            if (error.response.data?.errors) {
                console.error('   验证错误详情:');
                error.response.data.errors.forEach(err => {
                    console.error(`     - ${err.field || '未知字段'}: ${err.message}`);
                });
            }
        } else {
            console.error('   网络错误:', error.message);
        }
        return false;
    }
}

async function runAllTests() {
    console.log('🚀 开始API测试');
    console.log('='.repeat(50));
    
    const healthCheck = await testHealthCheck();
    const registration = await testUserRegistration();
    const token = await testLogin();
    const orderCreation = token ? await testOrderCreation(token) : false;
    
    const tests = [healthCheck, registration, token !== null, orderCreation];
    const passed = tests.filter(result => result).length;
    const total = tests.length;
    
    console.log('='.repeat(50));
    console.log(`📊 测试结果: ${passed}/${total} 通过`);
    
    if (passed === total) {
        console.log('🎉 所有API测试通过！');
        process.exit(0);
    } else {
        console.log('❌ 部分测试失败');
        process.exit(1);
    }
}

// 如果是直接运行此脚本
if (require.main === module) {
    runAllTests();
}