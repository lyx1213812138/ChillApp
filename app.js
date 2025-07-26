// app.js
const { APP_ID, APP_SECRET, APP_TOKEN, TABLE_ID } = require('./utils/config.js');
const websocket = require('./utils/webSocket.js');

App({
  globalData: {
    appid: APP_ID,
    appSecret: APP_SECRET,
    appToken: APP_TOKEN,
    tableId: TABLE_ID,
    isPlaying: false,
    audioDataQueue: [],
    agentTip: '',
    agentTipListeners: [] // 新增：用于存储页面回调函数的监听器数组
  },

  // 新增：注册监听函数
  registerAgentTipListener(listener) {
    this.globalData.agentTipListeners.push(listener);
  },

  // 新增：取消注册监听函数
  unregisterAgentTipListener(listener) {
    this.globalData.agentTipListeners = this.globalData.agentTipListeners.filter(
      item => item !== listener
    );
  },

  // 新增：更新 agentTip 并通知所有监听者
  updateAgentTip(newTip) {
    this.globalData.agentTip = newTip;
    // 遍历所有已注册的监听函数并执行它们
    this.globalData.agentTipListeners.forEach(listener => {
      listener(newTip);
    });
  },

  onLaunch() {
    websocket.connectWebSocket(this);
    console.log('App initialized with appid:', this.globalData.appid);
  },
})