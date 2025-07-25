// app.js
const websocket = require('./utils/webSocket.js');
App({
  globalData: {
    appid: '',
    appSecret: '',
    appToken: '',
    tableId: '',
  },
  onLaunch() {
    websocket.connectWebSocket(this);
    // 读privateData.json获取appId和appSecret
    wx.getFileSystemManager().readFile({
      filePath: 'privatedata.json',
      encoding: 'utf8',
      success: (res) => {
        const data = JSON.parse(res.data);
        this.globalData.appid = data.appid;
        this.globalData.appSecret = data.appSecret;
        console.log('App initialized with appid:', this.globalData.appid);
      },
      fail: (err) => {
        console.error('Failed to read privateData.json:', err);
      }
    });
  },
})
