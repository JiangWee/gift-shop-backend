// API 测试脚本
const https = require('https');

class ApiTester {
    constructor(baseURL) {
        this.baseURL = baseURL.replace('https://', '');
        this.accessToken = null;
    }

    async request(method, path, data = null, headers = {}) {
        return new Promise((resolve, reject) => {
            const options = {
                hostname: this.baseURL,
                port: 443,
                path: path,
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    ...headers
                }
            };

            const req = https.request(options, (res) => {
                let responseData = '';
                res.on('data', (chunk) => responseData += chunk);
                res.on('end', () => {
                    try {
                        const jsonData = JSON.parse(responseData);
                        resolve({
                            status: res.statusCode,
                            data: jsonData
                        });
                    } catch (e) {
                        resolve({
                            status: res.statusCode,
                            data: responseData
                        });
                    }
                });
            });

            req.on('error', reject);
            
            if (data) {
                req.write(JSON.stringify(data));
            }
            
            req.end();
        });
    }

    async testHealth() {
        console.log('🧪 测试健康检查...');
        const result = await this.request('GET', '/api/health');
        console.log('状态:', result.status, '-', result.data.status);
        return result.status === 200;
    }

    async testRegistration() {
        console.log('🧪 测试用户注册...');
        const testEmail = `test${Date.now()}@example.com`;
        const result = await this.request('POST', '/api/auth/register', {
            email: testEmail,
            phone: `138${Date.now().toString().slice(-8)}`,
            password: 'Test123456',
            confirm: 'Test123456'
        });
        
        console.log('状态:', result.status, '-', result.data.message);
        
        if (result.data.success) {
            this.accessToken = result.data.data.accessToken;
        }
        
        return result.status === 201;
    }

    async testOrderCreation() {
        if (!this.accessToken) {
            console.log('⚠️  需要先登录');
            return false;
        }

        console.log('🧪 测试订单创建...');
        const result = await this.request('POST', '/api/orders', {
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
                    street: '测试地址',
                    city: '测试城市',
                    state: '测试省',
                    zip: '100000',
                    country: 'china'
                }
            },
            gift_message: '测试订单',
            delivery_date: '2024-12-31'
        }, {
            'Authorization': `Bearer ${this.accessToken}`
        });

        console.log('状态:', result.status, '-', result.data.message);
        return result.status === 201;
    }

    async runAllTests() {
        console.log('🚀 开始API测试\n');
        
        const tests = [
            await this.testHealth(),
            await this.testRegistration(),
            await this.testOrderCreation()
        ];

        const passed = tests.filter(Boolean).length;
        const total = tests.length;
        
        console.log(`\n📊 测试结果: ${passed}/${total} 通过`);
        
        if (passed === total) {
            console.log('🎉 所有测试通过！');
        } else {
            console.log('❌ 部分测试失败');
        }
    }
}

// 如果是直接运行此脚本
if (require.main === module) {
    const tester = new ApiTester('https://giftbuybuy.vercel.app');
    tester.runAllTests();
}

module.exports = ApiTester;