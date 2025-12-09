require('dotenv').config();

const requiredEnvVars = [
  'JWT_SECRET',
  'DATABASE_URL'
  // 移除 Google Sheets 相关环境变量
];

console.log('🔧🔧 环境变量检查...');
requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    console.error(`❌❌ 缺失: ${varName}`);
    process.exit(1);
  } else {
    console.log(`✅ ${varName}: ${varName.includes('SECRET') ? '***' : process.env[varName].substring(0, 20)}...`);
  }
});
console.log('✅ 所有必需环境变量已配置');