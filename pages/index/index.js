// index.js

// 伪代码：需要一个 util.js 文件来提供 getUserConf
// const util = require('../../utils/util.js');

// 伪代码：需要定义消息类型
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

  onReady() {
    // onReady 中才能获取 camera context
    this.initCameraFrameListener();
  },

  // 初始化录音事件监听
  initRecordEvents() {
    const that = this;

    this.recorderManager.onStart(() => {
      console.log('录音已正式开始');
      that.setData({ isRecording: true });
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
      const { frameBuffer, isLastFrame } = res;
      if (that.data.socketOpen) {
        const message = {
          type: Type.audioFrame,
          data: frameBuffer,
          isLastFrame: isLastFrame,
          timestamp: Date.now()
        };
        console.log("onFrameRecorded",res)

        // wx.sendSocketMessage(...); // 暂时禁用上传
      }
    });

    this.recorderManager.onStop(() => {
      console.log('录音已结束');
      that.setData({ isRecording: false, isButtonPressed: false });
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

  initCameraFrameListener() {
    const that = this;
    const cameraContext = wx.createCameraContext();
    let lastUploadTime = 0;
    const uploadInterval = 100; // 100ms, 对应 10fps

    const listener = cameraContext.onCameraFrame((frame) => {
      const now = Date.now();
      if (now - lastUploadTime < uploadInterval) {
        return; // 未达到上传时间间隔，丢弃此帧
      }
      lastUploadTime = now;

      // 在这里处理帧数据，例如上传到云端
      console.log(`[Camera Frame] 模拟上传帧数据，尺寸: ${frame.width}x${frame.height}`);
      
      // 伪代码：上传逻辑
      // const frameData = new Uint8Array(frame.data); // 帧数据是 ArrayBuffer，需要转换
      // wx.request({
      //   url: 'YOUR_UPLOAD_URL',
      //   method: 'POST',
      //   data: frameData.buffer,
      //   // ...其他参数
      // });
    });

    // 启动监听
    listener.start();
    console.log('[Camera Frame] 摄像头帧数据监听已启动');
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
  }
});
