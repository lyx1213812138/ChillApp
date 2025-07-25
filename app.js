// app.js
const websocket = require('./utils/webSocket.js');
App({
  onLaunch() {
    websocket.connectWebSocket(this);
  },
})
