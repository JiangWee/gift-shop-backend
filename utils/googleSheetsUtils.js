const { google } = require('googleapis');
const googleSheetsService = require('../config/google-sheets');

class GoogleSheetsUtils {
    constructor() {
        this.sheetId = process.env.GOOGLE_SHEET_ID;
    }

    // 添加新订单到Google表格
    async addOrder(orderData) {
        try {
            const authClient = await googleSheetsService.getAuthClient();
            
            const request = {
                spreadsheetId: this.sheetId,
                range: '订单列表!A:Z',
                valueInputOption: 'USER_ENTERED',
                insertDataOption: 'INSERT_ROWS',
                resource: {
                    values: [this.formatOrderRow(orderData)]
                },
                auth: authClient,
            };

            const response = await google.sheets('v4').spreadsheets.values.append(request);
            console.log('✅ 订单已保存到Google表格，行号:', response.data.updates.updatedRange);
            
            return {
                success: true,
                updatedRows: response.data.updates.updatedRows,
                sheetUrl: `https://docs.google.com/spreadsheets/d/${this.sheetId}`
            };

        } catch (error) {
            console.error('❌ 保存订单到Google表格失败:', error);
            throw new Error('订单保存失败: ' + error.message);
        }
    }

    // 获取用户订单列表
    async getUserOrders(userId) {
        try {
            const authClient = await googleSheetsService.getAuthClient();
            
            const request = {
                spreadsheetId: this.sheetId,
                range: '订单列表!A:M',
                auth: authClient,
            };

            const response = await google.sheets('v4').spreadsheets.values.get(request);
            const rows = response.data.values;
            
            if (!rows || rows.length <= 1) { // 第一行是标题
                return [];
            }

            // 过滤出当前用户的订单（用户ID在C列，索引2）
            const userOrders = rows.slice(1) // 跳过标题行
                .filter(row => row[2] === userId)
                .map(row => this.parseOrderRow(row));

            return userOrders;

        } catch (error) {
            console.error('❌ 从Google表格获取订单失败:', error);
            return [];
        }
    }

    // 格式化订单数据为表格行
    formatOrderRow(orderData) {
        return [
            new Date().toISOString(),                    // A: 时间戳
            orderData.orderId,                           // B: 订单ID
            orderData.userId,                            // C: 用户ID
            orderData.userEmail,                         // D: 用户邮箱
            orderData.productName,                       // E: 产品名称
            orderData.price,                             // F: 价格
            orderData.quantity,                          // G: 数量
            orderData.buyerName,                         // H: 购买者姓名
            orderData.recipientName,                     // I: 收件人姓名
            orderData.status || 'pending',               // J: 订单状态
            JSON.stringify(orderData.buyerInfo),         // K: 购买者信息(JSON)
            JSON.stringify(orderData.recipientInfo),    // L: 收件人信息(JSON)
            orderData.giftMessage || '',                 // M: 礼品留言
            orderData.deliveryDate                       // N: 送达日期
        ];
    }

    // 解析表格行为订单对象
    parseOrderRow(row) {
        return {
            timestamp: row[0],
            orderId: row[1],
            userId: row[2],
            userEmail: row[3],
            productName: row[4],
            price: parseFloat(row[5]) || 0,
            quantity: parseInt(row[6]) || 1,
            buyerName: row[7],
            recipientName: row[8],
            status: row[9] || 'pending',
            buyerInfo: this.safeJsonParse(row[10]),
            recipientInfo: this.safeJsonParse(row[11]),
            giftMessage: row[12] || '',
            deliveryDate: row[13]
        };
    }

    // 安全的JSON解析
    safeJsonParse(str) {
        try {
            return str ? JSON.parse(str) : {};
        } catch (error) {
            console.warn('JSON解析失败:', str);
            return {};
        }
    }

    // 更新订单状态
    async updateOrderStatus(orderId, newStatus) {
        try {
            const authClient = await googleSheetsService.getAuthClient();
            
            // 先获取所有订单找到目标行
            const request = {
                spreadsheetId: this.sheetId,
                range: '订单列表!A:M',
                auth: authClient,
            };

            const response = await google.sheets('v4').spreadsheets.values.get(request);
            const rows = response.data.values;
            
            if (!rows || rows.length <= 1) {
                throw new Error('订单未找到');
            }

            // 查找订单所在行（订单ID在B列，索引1）
            const orderIndex = rows.findIndex(row => row[1] === orderId);
            if (orderIndex === -1) {
                throw new Error('订单未找到');
            }

            // 更新状态（状态在J列，索引9）
            const updateRequest = {
                spreadsheetId: this.sheetId,
                range: `订单列表!J${orderIndex + 1}`, // +1因为API行号从1开始
                valueInputOption: 'RAW',
                resource: {
                    values: [[newStatus]]
                },
                auth: authClient,
            };

            await google.sheets('v4').spreadsheets.values.update(updateRequest);
            return { success: true };

        } catch (error) {
            console.error('❌ 更新订单状态失败:', error);
            throw error;
        }
    }
}

module.exports = new GoogleSheetsUtils();