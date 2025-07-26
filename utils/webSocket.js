/*
this.socketOpen: false
this.data.audioDataQueue: []
*/


const util = require('./util.js');
const Type = {
    audioFrame: 'audioFrame',
    confJson: 'confJson',
};

function connectWebSocket(that) {
  that.socketOpen = false;
  that.globalData.isPlaying = false;
  wx.connectSocket({
    url: 'ws://172.20.10.2:8000/audioStream', // 替换为实际服务器地址
  });

  wx.onSocketOpen(function() {
    console.log('WebSocket连接已打开');
    that.socketOpen = true;
  });

  wx.onSocketMessage(function(res) {
    console.log('receive message', res)
    if (typeof res.data === 'string') { // cmd
      const data = JSON.parse(res.data);
      console.log('receive cmd', data);
      if (data.cmd === 'StartAudioDn') {
        that.globalData.isPlaying = false;
      } else if (data.cmd === 'StopAudioDn') {
        that.globalData.audioDataQueue = [];
      } else if (data.cmd === 'agentTip') {
        that.globalData.agentTip = data.data;
      }
    } else {
      handleAudioFrame.call(that, res.data);
    }
    that.socketOpen = true;
  });

  wx.onSocketError(function(err) {
    console.error('WebSocket连接错误:', err);
    that.audioCtx.close();
    that.socketOpen = false;
  });

  wx.onSocketClose(function() {
    console.log('WebSocket连接已关闭');
    that.audioCtx.close();
    that.socketOpen = false;
  });
};


function handleAudioFrame(audioData) {
  const self = this;
  this.globalData.audioDataQueue.push(audioData);
  console.log('handleAudioFrame', this.globalData.isPlaying, this.globalData.audioDataQueue)
  if (!this.globalData.isPlaying) {
      util.audioPlayInit(this, this.audioCtx, this.globalData.audioDataQueue, () => {
        self.data.isPlaying = false;
      });
  }
}

module.exports = {
  connectWebSocket
};