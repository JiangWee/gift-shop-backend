const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

class UploadController {
    // 上传图片
    async uploadImage(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: '请选择要上传的图片'
                });
            }

            // 图片处理（压缩和调整大小）
            const processedImagePath = path.join(
                path.dirname(req.file.path),
                'processed-' + req.file.filename
            );

            await sharp(req.file.path)
                .resize(800, 800, { // 调整大小
                    fit: sharp.fit.inside,
                    withoutEnlargement: true
                })
                .jpeg({ quality: 80 }) // 转换为JPEG并压缩
                .toFile(processedImagePath);

            // 删除原始文件
            fs.unlinkSync(req.file.path);

            // 更新文件信息
            const processedFile = {
                ...req.file,
                filename: 'processed-' + req.file.filename,
                path: processedImagePath
            };

            // 构建可访问的URL
            const imageUrl = `${process.env.BASE_URL || 'http://localhost:3000'}/uploads/${processedFile.filename}`;

            res.json({
                success: true,
                message: '图片上传成功',
                data: {
                    filename: processedFile.filename,
                    originalName: req.file.originalname,
                    mimetype: processedFile.mimetype,
                    size: processedFile.size,
                    url: imageUrl
                }
            });

        } catch (error) {
            console.error('图片上传错误:', error);
            res.status(500).json({
                success: false,
                message: '图片上传失败'
            });
        }
    }

    // 获取上传的文件
    async getFile(req, res) {
        try {
            const filename = req.params.filename;
            const filePath = path.join(__dirname, '../uploads', filename);

            if (!fs.existsSync(filePath)) {
                return res.status(404).json({
                    success: false,
                    message: '文件不存在'
                });
            }

            res.sendFile(filePath);
        } catch (error) {
            console.error('获取文件错误:', error);
            res.status(500).json({
                success: false,
                message: '获取文件失败'
            });
        }
    }

    // 删除文件
    async deleteFile(req, res) {
        try {
            const filename = req.params.filename;
            const filePath = path.join(__dirname, '../uploads', filename);

            if (!fs.existsSync(filePath)) {
                return res.status(404).json({
                    success: false,
                    message: '文件不存在'
                });
            }

            fs.unlinkSync(filePath);

            res.json({
                success: true,
                message: '文件删除成功'
            });
        } catch (error) {
            console.error('删除文件错误:', error);
            res.status(500).json({
                success: false,
                message: '文件删除失败'
            });
        }
    }
}

module.exports = new UploadController();