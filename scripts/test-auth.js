require('dotenv').config();
const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

class AuthTester {
    constructor() {
        this.client = axios.create({
            baseURL: BASE_URL,
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        this.accessToken = null;
        this.refreshToken = null;
        this.testUser = null;
    }

    async testHealth() {
        console.log('🧪 测试健康检查...');
        try {
            const response = await this.client.get('/health');
            console.log('✅ 健康检查通过:', response.data.message);
            return true;
        } catch (error) {
            console.error('❌ 健康检查失败:', error.message);
            return false;
        }
    }

    async testRegistration() {
        console.log('\n🧪 测试用户注册...');
        
        const testEmail = `test${Date.now()}@example.com`;
        const testPhone = `138${Date.now().toString().slice(-8)}`;
        
        const userData = {
            email: testEmail,
            phone: testPhone,
            password: 'Test123456',
            confirm: 'Test123456'
        };
        
        try {
            const response = await this.client.post('/auth/register', userData);
            
            if (response.data.success) {
                this.accessToken = response.data.data.accessToken;
                this.refreshToken = response.data.data.refreshToken;
                this.testUser = response.data.data.user;
                
                console.log('✅ 用户注册成功:');
                console.log('   用户ID:', this.testUser.id);
                console.log('   邮箱:', this.testUser.email);
                console.log('   Access Token:', this.accessToken ? '已获取' : '未获取');
                
                return true;
            } else {
                console.error('❌ 注册失败:', response.data.message);
                return false;
            }
        } catch (error) {
            if (error.response) {
                console.error('❌ 注册请求失败:', error.response.data.message);
                if (error.response.data.errors) {
                    error.response.data.errors.forEach(err => {
                        console.error('   错误详情:', err.field, '-', err.message);
                    });
                }
            } else {
                console.error('❌ 注册请求失败:', error.message);
            }
            return false;
        }
    }

    async testLogin() {
        console.log('\n🧪 测试用户登录...');
        
        // 如果之前注册失败，使用测试账号
        const loginData = {
            identifier: this.testUser ? this.testUser.email : 'test@example.com',
            password: 'Test123456'
        };
        
        try {
            const response = await this.client.post('/auth/login', loginData);
            
            if (response.data.success) {
                this.accessToken = response.data.data.accessToken;
                this.refreshToken = response.data.data.refreshToken;
                this.testUser = response.data.data.user;
                
                console.log('✅ 用户登录成功:');
                console.log('   用户:', this.testUser.email);
                console.log('   Access Token:', this.accessToken ? '已获取' : '未获取');
                
                return true;
            } else {
                console.error('❌ 登录失败:', response.data.message);
                return false;
            }
        } catch (error) {
            if (error.response) {
                console.error('❌ 登录请求失败:', error.response.data.message);
            } else {
                console.error('❌ 登录请求失败:', error.message);
            }
            return false;
        }
    }

    async testGetProfile() {
        console.log('\n🧪 测试获取用户信息...');
        
        if (!this.accessToken) {
            console.error('❌ 需要先登录获取Token');
            return false;
        }
        
        try {
            const response = await this.client.get('/auth/me', {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
            });
            
            if (response.data.success) {
                console.log('✅ 获取用户信息成功:');
                console.log('   用户ID:', response.data.data.user.id);
                console.log('   邮箱:', response.data.data.user.email);
                console.log('   用户名:', response.data.data.user.username);
                console.log('   注册时间:', response.data.data.user.created_at);
                
                return true;
            } else {
                console.error('❌ 获取用户信息失败:', response.data.message);
                return false;
            }
        } catch (error) {
            if (error.response) {
                console.error('❌ 获取用户信息失败:', error.response.data.message);
                console.error('   状态码:', error.response.status);
            } else {
                console.error('❌ 获取用户信息失败:', error.message);
            }
            return false;
        }
    }

    async testTokenValidation() {
        console.log('\n🧪 测试Token验证...');
        
        if (!this.accessToken) {
            console.error('❌ 需要先登录获取Token');
            return false;
        }
        
        try {
            const response = await this.client.get('/auth/validate', {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
            });
            
            if (response.data.success) {
                console.log('✅ Token验证成功:', response.data.message);
                return true;
            } else {
                console.error('❌ Token验证失败:', response.data.message);
                return false;
            }
        } catch (error) {
            if (error.response) {
                console.error('❌ Token验证失败:', error.response.data.message);
            } else {
                console.error('❌ Token验证失败:', error.message);
            }
            return false;
        }
    }

    async testLogout() {
        console.log('\n🧪 测试用户退出...');
        
        if (!this.accessToken) {
            console.error('❌ 需要先登录获取Token');
            return false;
        }
        
        try {
            const response = await this.client.post('/auth/logout', {}, {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
            });
            
            if (response.data.success) {
                console.log('✅ 用户退出成功:', response.data.message);
                // 清除Token
                this.accessToken = null;
                this.refreshToken = null;
                return true;
            } else {
                console.error('❌ 退出失败:', response.data.message);
                return false;
            }
        } catch (error) {
            if (error.response) {
                console.error('❌ 退出请求失败:', error.response.data.message);
            } else {
                console.error('❌ 退出请求失败:', error.message);
            }
            return false;
        }
    }

    async runAllTests() {
        console.log('🚀 开始认证功能测试');
        console.log('='.repeat(60));
        
        const tests = [
            await this.testHealth(),
            await this.testRegistration(),
            await this.testLogin(),
            await this.testGetProfile(),
            await this.testTokenValidation(),
            await this.testLogout()
        ];
        
        const passed = tests.filter(Boolean).length;
        const total = tests.length;
        
        console.log('='.repeat(60));
        console.log(`📊 测试结果: ${passed}/${total} 通过`);
        
        if (passed === total) {
            console.log('🎉🎉 所有认证功能测试通过！');
        } else {
            console.log('❌ 部分测试失败，请检查以上错误信息');
        }
        
        return passed === total;
    }
}

// 如果是直接运行此脚本
if (require.main === module) {
    // 检查服务器是否运行
    const tester = new AuthTester();
    
    tester.runAllTests().then(success => {
        if (success) {
            console.log('\n💡 下一步建议:');
            console.log('   1. 使用Thunder Client或Postman测试API');
            console.log('   2. 创建前端界面连接这些接口');
            console.log('   3. 添加订单管理功能');
        }
        process.exit(success ? 0 : 1);
    }).catch(error => {
        console.error('❌ 测试运行失败:', error);
        process.exit(1);
    });
}

module.exports = AuthTester;