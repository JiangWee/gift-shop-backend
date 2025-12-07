require('dotenv').config();
const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚀 开始部署准备...');

// 检查环境变量
const requiredEnvVars = [
  'JWT_SECRET',
  'DATABASE_URL',
  'GOOGLE_SHEET_ID',
  'GOOGLE_CREDENTIALS_JSON'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ 缺少必要的环境变量:');
  missingVars.forEach(varName => console.error(`   - ${varName}`));
  process.exit(1);
}

console.log('✅ 环境变量检查通过');

// 构建步骤
try {
  console.log('📦 安装依赖...');
  execSync('npm install', { stdio: 'inherit' });

  console.log('🧪 运行测试...');
  execSync('npm run test:config', { stdio: 'inherit' });

  console.log('🔧 构建前端...');
  // 这里可以添加前端构建命令
  // execSync('cd frontend && npm run build', { stdio: 'inherit' });

  console.log('✅ 部署准备完成！');
  console.log('\n💡 下一步:');
  console.log('   1. 将代码推送到GitHub');
  console.log('   2. 连接Vercel并部署');
  console.log('   3. 设置生产环境变量');

} catch (error) {
  console.error('❌ 部署准备失败:', error.message);
  process.exit(1);
}