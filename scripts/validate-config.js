require('dotenv').config();

function validateJWTConfig() {
    console.log('🔐 验证JWT配置...');
    console.log('='.repeat(50));
    
    const config = {
        JWT_SECRET: process.env.JWT_SECRET,
        ACCESS_TOKEN_EXPIRES: process.env.ACCESS_TOKEN_EXPIRES,
        REFRESH_TOKEN_EXPIRES: process.env.REFRESH_TOKEN_EXPIRES,
        NODE_ENV: process.env.NODE_ENV
    };
    
    let isValid = true;
    const warnings = [];
    const errors = [];
    
    // 检查密钥是否存在
    if (!config.JWT_SECRET) {
        errors.push('❌ JWT_SECRET未设置');
        isValid = false;
    } 
    // 检查是否是默认密钥
    else if (config.JWT_SECRET.includes('change-this-in-production')) {
        warnings.push('⚠️ 使用的是默认JWT密钥，生产环境请立即更改！');
    }
    // 检查密钥长度
    else if (config.JWT_SECRET.length < 32) {
        warnings.push('⚠️ JWT密钥长度建议至少32位');
    }
    
    // 检查环境
    if (config.NODE_ENV === 'production' && warnings.length > 0) {
        errors.push('❌ 生产环境存在安全警告，请解决后再部署');
        isValid = false;
    }
    
    console.log('📊 配置详情:');
    console.log('   环境:', config.NODE_ENV || 'development');
    console.log('   密钥长度:', config.JWT_SECRET ? config.JWT_SECRET.length : '未设置');
    console.log('   Access Token过期:', config.ACCESS_TOKEN_EXPIRES);
    console.log('   Refresh Token过期:', config.REFRESH_TOKEN_EXPIRES);
    
    if (warnings.length > 0) {
        console.log('\n⚠️ 警告:');
        warnings.forEach(warning => console.log('   ' + warning));
    }
    
    if (errors.length > 0) {
        console.log('\n❌ 错误:');
        errors.forEach(error => console.log('   ' + error));
    }
    
    console.log('='.repeat(50));
    console.log(isValid ? '✅ 配置验证通过' : '❌ 配置验证失败');
    
    return isValid;
}

// 运行验证
if (require.main === module) {
    const isValid = validateJWTConfig();
    process.exit(isValid ? 0 : 1);
}

module.exports = validateJWTConfig;