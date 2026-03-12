// utils/cryptoUtils.js
const crypto = require('crypto');

/**
 * 生成SHA256哈希
 */
function createHash(algorithm = 'sha256') {
    return {
        update: function(data) {
            this.data = data;
            return this;
        },
        digest: function(encoding = 'hex') {
            const hash = crypto.createHash(algorithm);
            hash.update(this.data);
            return hash.digest(encoding);
        }
    };
}

/**
 * 生成RSA签名
 */
function generateSignature(params, privateKey) {
    // 对参数排序并拼接
    const sortedParams = Object.keys(params)
        .sort()
        .map(key => `${key}=${params[key]}`)
        .join('&');
    
    // 创建签名
    const signer = crypto.createSign('RSA-SHA256');
    signer.update(sortedParams);
    signer.end();
    
    return signer.sign(privateKey, 'base64');
}

/**
 * 验证签名
 */
function verifySignature(params, signature, publicKey) {
    const sortedParams = Object.keys(params)
        .sort()
        .filter(key => key !== 'sign' && key !== 'sign_type')
        .map(key => `${key}=${params[key]}`)
        .join('&');
    
    const verifier = crypto.createVerify('RSA-SHA256');
    verifier.update(sortedParams);
    verifier.end();
    
    return verifier.verify(publicKey, signature, 'base64');
}

/**
 * 生成随机字符串
 */
function generateNonceStr(length = 32) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

/**
 * AES加密
 */
function aesEncrypt(data, key, iv) {
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(data, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    return encrypted;
}

/**
 * AES解密
 */
function aesDecrypt(encryptedData, key, iv) {
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encryptedData, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

/**
 * 生成MD5签名（微信支付常用）
 */
function md5Sign(params, apiKey) {
    const stringA = Object.keys(params)
        .sort()
        .map(key => `${key}=${params[key]}`)
        .join('&');
    
    const stringSignTemp = `${stringA}&key=${apiKey}`;
    return crypto.createHash('md5')
        .update(stringSignTemp, 'utf8')
        .digest('hex')
        .toUpperCase();
}

/**
 * 生成时间戳
 */
function generateTimestamp() {
    return Math.floor(Date.now() / 1000).toString();
}

module.exports = {
    createHash,
    generateSignature,
    verifySignature,
    generateNonceStr,
    aesEncrypt,
    aesDecrypt,
    md5Sign,
    generateTimestamp
};