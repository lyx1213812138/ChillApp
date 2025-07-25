// app.js
const { APP_ID, APP_SECRET, APP_TOKEN, TABLE_ID } = require('./utils/config.js');
const websocket = require('./utils/webSocket.js');

App({
  globalData: {
    appid: APP_ID,
    appSecret: APP_SECRET,
    appToken: APP_TOKEN,
    tableId: TABLE_ID,
  },
  onLaunch() {
    websocket.connectWebSocket(this);
    console.log('App initialized with appid:', this.globalData.appid);
  },
})
