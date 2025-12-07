const app = require('../app');
const path = require('path');
const fs = require('fs');

module.exports = async (req, res) => {
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  // 处理预检请求
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 处理文件服务
  if (req.url.startsWith('/uploads/')) {
    const filename = req.url.split('/').pop();
    const filePath = path.join(process.cwd(), 'uploads', filename);
    
    if (fs.existsSync(filePath)) {
      const fileStream = fs.createReadStream(filePath);
      const mimeType = require('mime-types').lookup(filePath);
      
      res.setHeader('Content-Type', mimeType || 'application/octet-stream');
      fileStream.pipe(res);
      return;
    } else {
      res.status(404).json({ error: 'File not found' });
      return;
    }
  }

  // 将请求传递给Express应用
  return app(req, res);
};