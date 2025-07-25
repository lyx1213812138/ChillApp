
const util = require('../../utils/util.js');

const Type = {
  audioFrame: 'audioFrame'
};

Page({
  data: {
    messages: [
      { id: 0, sender: 'ai', content: '你好，我是你的摄影助手，请问有什么可以帮你的吗？' },
      { id: 1, sender: 'user', content: '我想拍一张人像照片，有什么建议吗？' }
    ],
    hasRecordPermission: false,
    socketOpen: false, // WebSocket连接状态, 暂时不检查
    isRecording: false, // 是否正在录音
    isButtonPressed: false, // 按钮是否被按下
    currentTip: '', // AI提示
    showSurvey: false // 是否显示问卷
  },

  onLoad() {
    this.recorderManager = wx.getRecorderManager();
    this.initRecordEvents();
    this.checkRecordPermission();
    this.checkSurveyStatus();
  },

  // 初始化录音事件监听
  initRecordEvents() {
    const that = this;

    this.recorderManager.onStart(() => {
      console.log('录音已正式开始');
      that.setData({ isRecording: true });
      if (that.data.socketOpen) {
        wx.sendSocketMessage({
          data: JSON.stringify({
            devType: 'WX',
            cmd: 'StartAudioUp',
          }),
          success: () => {
            console.log('开始标志发送成功');
          },
          fail: (err) => {
            console.error('开始标志发送失败:', err);
          }
        });
      }
    });

    this.recorderManager.onError((err) => {
      console.error('录音错误:', err);
      wx.showToast({
        title: '录音失败',
        icon: 'none'
      });
      that.setData({ isRecording: false, isButtonPressed: false });
    });

    this.recorderManager.onFrameRecorded((res) => {
      const { frameBuffer } = res;
      if (that.data.socketOpen) {
        wx.sendSocketMessage({
          data: frameBuffer,
          success: () => {
            console.log('音频帧发送成功');
          },
          fail: (err) => {
            console.error('音频帧发送失败:', err);
          }
        });
        // wx.sendSocketMessage(...); // 暂时禁用上传
      }
    });

    this.recorderManager.onStop(() => {
      console.log('录音已结束');
      that.setData({ isRecording: false, isButtonPressed: false });
      if (that.data.socketOpen) {
        wx.sendSocketMessage({
          data: JSON.stringify({
            devType: 'WX',
            cmd: 'StopAudioUp',
          }),
          success: () => {
            console.log('结束标志发送成功');
          },
          fail: (err) => {
            console.error('结束标志发送失败:', err);
          }
        });
      }
    });
  },

  // 检查录音权限
  checkRecordPermission() {
    wx.getSetting({
      success: (res) => {
        if (res.authSetting['scope.record']) {
          this.setData({ hasRecordPermission: true });
        }
      }
    });
  },

  // 请求录音权限
  requestRecordPermission() {
    wx.authorize({
      scope: 'scope.record',
      success: () => {
        this.setData({ hasRecordPermission: true });
        this.startRecording(); // 获取权限后直接开始
      },
      fail: () => {
        this.setData({ hasRecordPermission: false });
        wx.showToast({
          title: '需要麦克风权限才能录音',
          icon: 'none'
        });
      }
    });
  },

  // 按下按钮，开始录音
  startRecording() {
    if (this.data.isRecording) {
      console.log('已经在录音中，操作无效');
      return;
    }
    this.setData({ isButtonPressed: true });

    if (!this.data.hasRecordPermission) {
      this.requestRecordPermission();
      return;
    }

    this.recorderManager.start({
      format: 'pcm',
      sampleRate: 16000,
      numberOfChannels: 1,
      encodeBitRate: 64000,
      frameSize: 50
    });
  },

  // 松开按钮，停止录音
  stopRecording() {
    if (!this.data.isRecording) {
      console.log('已经停止录音，操作无效');
      return;
    }
    console.log('松开按钮，调用 stop');
    this.recorderManager.stop();
  },

  checkSurveyStatus() {
    const surveyCompleted = wx.getStorageSync('surveyCompleted');
    if (!surveyCompleted) {
      this.setData({ showSurvey: true });
    }
  },

  onSurveySubmit(e) {
    const surveyResult = e.detail;
    console.log('问卷结果:', surveyResult);
    wx.setStorageSync('surveyResult', surveyResult);
    wx.setStorageSync('surveyCompleted', true);
    this.setData({ showSurvey: false });
    wx.showToast({
      title: '感谢您的反馈！',
      icon: 'success'
    });
  },

  // 将消息转换为Buffer
  frameToBuffer(message) {
    return JSON.stringify(message);
  },

  // 拍照
  takePhoto() {
    console.log('takePhoto')
    this.data.canPostImage = true;
    const ctx = wx.createCameraContext();
    ctx.takePhoto({
      quality: 'high',
      success: (res) => {
        wx.navigateTo({
          url: `/pages/preview/preview?imagePath=${res.tempImagePath}`
        });
      },
      fail: (err) => {
        console.error('拍照失败:', err);
        wx.showToast({
          title: '拍照失败',
          icon: 'none'
        });
      }
    });
  },

  // camera
  //bindstop="onCameraStop"
  // binderror="onCameraError"
  // bindinitdone="onCameraInit"
  onCameraInit() {
    this.cameraListner = util.startPostImage.call(this);
    this.data.canPostImage = true;
    console.log('Camera initialized');
  },

  onCameraStop() {
    util.stopPostImage(this.cameraListner);
    // clearInterval(this.postImageInterval);
    this.data.canPostImage = false;
    this.cameraListner = null;
    console.log('Camera stopped');
  },
  
});
