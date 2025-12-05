const { google } = require('googleapis');

class GoogleSheetsService {
    constructor() {
        this.auth = null;
        this.sheets = google.sheets('v4');
        this.init();
    }

    async init() {
        try {
            // 方法1: 使用环境变量中的JSON凭证
            if (process.env.GOOGLE_CREDENTIALS_JSON) {
                const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);
                this.auth = new google.auth.GoogleAuth({
                    credentials: credentials,
                    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
                });
            }
            // 方法2: 使用服务账号邮箱
            else if (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL) {
                this.auth = new google.auth.GoogleAuth({
                    keyFile: 'credentials.json', // 在生产环境中使用环境变量
                    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
                });
            } else {
                console.warn('⚠️  Google Sheets认证配置未找到');
            }
            
            console.log('✅ Google Sheets服务初始化完成');
        } catch (error) {
            console.error('❌ Google Sheets服务初始化失败:', error);
        }
    }

    async getAuthClient() {
        if (!this.auth) {
            await this.init();
        }
        return await this.auth.getClient();
    }

    // 测试连接
    async testConnection() {
        try {
            const authClient = await this.getAuthClient();
            const response = await this.sheets.spreadsheets.get({
                spreadsheetId: process.env.GOOGLE_SHEET_ID,
                auth: authClient,
            });
            
            console.log('✅ Google Sheets连接成功:', response.data.properties.title);
            return true;
        } catch (error) {
            console.error('❌ Google Sheets连接失败:', error.message);
            return false;
        }
    }
}

module.exports = new GoogleSheetsService();