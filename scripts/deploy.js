require('dotenv').config();
const { execSync } = require('child_process');

console.log('🚀 Railway部署前检查开始...\n');

try {
  // 1. 检查环境变量
  console.log('1. 检查环境变量...');
  require('./validate-env.js');
  
  // 2. 检查数据库连接
  console.log('\n2. 测试数据库连接...');
  execSync('npm run test:db', { stdio: 'inherit' });
  
  // 3. 检查配置文件
  console.log('\n3. 验证配置文件...');
  execSync('npm run test:config', { stdio: 'inherit' });
  
  // 4. 语法检查
  console.log('\n4. 语法检查...');
  execSync('node -c server.js', { stdio: 'inherit' });
  execSync('node -c app.js', { stdio: 'inherit' });
  
  // 5. 依赖检查
  console.log('\n5. 检查依赖...');
  const pkg = require('../package.json');
  const requiredDeps = ['express', 'mysql2', 'googleapis', 'jsonwebtoken'];
  requiredDeps.forEach(dep => {
    if (!pkg.dependencies[dep]) {
      throw new Error(`缺失依赖: ${dep}`);
    }
  });
  console.log('✅ 所有必需依赖已安装');
  
  console.log('\n🎉 所有检查通过！可以部署到Railway');
  
} catch (error) {
  console.error('\n❌ 部署检查失败:', error.message);
  process.exit(1);
}