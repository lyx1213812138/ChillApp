// utils/config.js
// 该模块负责从 privatedata.js 导入敏感配置，并作为常量导出。

const privateData = require('../privatedata.js');

// 使用 module.exports 导出，以兼容 app.js 中的 require
module.exports = {
  APP_ID: privateData.appid || '',
  APP_SECRET: privateData.appSecret || '',
  APP_TOKEN: privateData.appToken || '',
  TABLE_ID: privateData.tableId || ''
};
