const express = require('express');
const uploadController = require('../controllers/uploadController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { upload, handleUploadError } = require('../config/upload');

const router = express.Router();

// 所有上传路由都需要认证
router.use(authenticateToken);

// 上传图片
router.post('/image', 
    upload.single('image'),
    handleUploadError,
    uploadController.uploadImage
);

// 获取上传的文件
router.get('/:filename', uploadController.getFile);

// 删除文件
router.delete('/:filename', uploadController.deleteFile);

module.exports = router;