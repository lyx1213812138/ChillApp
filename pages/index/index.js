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
    showSurvey: false, // 是否显示问卷
    prefilledInfo: null // 用于预填问卷的用户信息
  },

  onLoad() {
    this.recorderManager = wx.getRecorderManager();
    this.initRecordEvents();
    this.checkRecordPermission();
    this.checkSurveyStatus();
  },

  onReady() {
    // onReady 中可以进行一些初始化，但监听器启动/停止放在 onShow/onHide 中
  },

  onShow() {
    // 页面显示时启动摄像头帧监听
    this.initCameraFrameListener();
  },

  onHide() {
    // 页面隐藏时停止摄像头帧监听
    if (this.cameraFrameListener) {
      this.cameraFrameListener.stop();
      console.log('[Camera Frame] 摄像头帧数据监听已停止');
    }
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

    this.cameraFrameListener = cameraContext.onCameraFrame((frame) => {
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
    this.cameraFrameListener.start();
    console.log('[Camera Frame] 摄像头帧数据监听已启动');
  },

  checkSurveyStatus() {
    const surveyCompleted = wx.getStorageSync('surveyCompleted');
    if (!surveyCompleted) {
      // 微信新规：wx.getUserProfile 必须由用户点击触发
      // 因此，我们先显示问卷/授权提示，让用户点击按钮后才调用授权
      this.setData({ 
        showSurvey: true 
      });
    }
  },

  // 此函数需要绑定到 WXML 中的授权按钮的 tap 事件
  handleAuthorize() {
    wx.getUserProfile({
      desc: '用于完善您的个人资料和偏好',
      success: (res) => {
        // 将获取到的用户信息预填到问卷中
        this.setData({ 
          prefilledInfo: res.userInfo
        });
        wx.showToast({ title: '授权成功', icon: 'success' });
      },
      fail: () => {
        // 如果用户拒绝，可以给一个提示
        wx.showToast({ title: '授权后可获得个性化推荐', icon: 'none' });
      }
    });
  },

  onSurveySubmit(e) {
    const surveyResult = e.detail;
    console.log('问卷结果:', surveyResult);

    // 上传到云端
    this.uploadDataToServer(surveyResult);
  },

  uploadDataToServer(data) {
    const that = this;
    wx.showLoading({ title: '正在保存... ', mask: true });

    // 伪代码：你需要替换成你真实的云端API地址
    const apiUrl = 'https://your-api.com/submit-survey';

    wx.request({
      url: apiUrl,
      method: 'POST',
      data: data,
      success(res) {
        if (res.statusCode === 200) {
          console.log('数据上传成功:', res.data);
          // 只有上传成功后，才标记问卷已完成
          wx.setStorageSync('surveyResult', data);
          wx.setStorageSync('surveyCompleted', true);
          that.setData({ showSurvey: false });
          wx.showToast({ title: '感谢您的反馈！', icon: 'success' });
        } else {
          // 处理服务器错误
          wx.showToast({ title: '保存失败，请稍后重试', icon: 'none' });
        }
      },
      fail(err) {
        console.error('数据上传失败:', err);
        wx.showToast({ title: '网络错误，请稍后重试', icon: 'none' });
      },
      complete() {
        wx.hideLoading();
      }
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
