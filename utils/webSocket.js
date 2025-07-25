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
  wx.connectSocket({
    url: 'ws://192.168.150.97:8000/audioStream', // 替换为实际服务器地址
  });

  wx.onSocketOpen(function() {
    console.log('WebSocket连接已打开');
    that.socketOpen = true;
  });

  wx.onSocketMessage(function(res) {
    console.log('receive message', res)
    if (typeof res.data === 'string') { // cmd
      const data = JSON.parse(res.data);
      if (data.cmd === 'StartAudioDn') {
        util.audioPlayInit(this.data.audioDataQueue, () => {
          that.data.isPlaying = false;
        });
      } else if (data.cmd === 'StopAudioDn') {
        that.data.audioDataQueue = [];
      } else if (data.cmd === 'agentTip') {
        that.setData({ agentTip: data.data });
      }
    } else {
      handleAudioFrame.call(that, res.data);
    }
    that.socketOpen = true;
  });

  wx.onSocketError(function(err) {
    console.error('WebSocket连接错误:', err);
    that.socketOpen = false;
  });

  wx.onSocketClose(function() {
    console.log('WebSocket连接已关闭');
    that.socketOpen = false;
  });
};


function handleAudioFrame(audioData) {
  const self = this;
  if (!this.data.isPlaying) {
      this.data.isPlaying = true;
      util.audioPlayInit(this.data.audioDataQueue, () => {
        self.data.isPlaying = false;
      });
  }
  console.log(header);
  this.audioDataQueue.push(audioData);
}

module.exports = {
  connectWebSocket
};