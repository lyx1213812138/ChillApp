
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
    showSurvey: false, // 是否显示问卷
    prefilledInfo: null, // 用于预填问卷的用户信息
    showAuthModal: false // 新增：控制授权弹窗的显示
  },

  onLoad() {
    this.recorderManager = wx.getRecorderManager();
    this.initRecordEvents();
    this.checkRecordPermission();

    // 检查是否已授权，决定显示主内容还是授权弹窗
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.checkSurveyStatus(); // 如果已授权，则检查是否需要填问卷
    } else {
      this.setData({ showAuthModal: true }); // 未授权，显示授权弹窗
    }

    // 定义一个专门用来处理 agentTip 更新的函数，并绑定 this
    this.agentTipUpdateHandler = (newTip) => {
      this.setData({ currentTip: newTip });
    };
  },

  // 处理授权弹窗的点击事件
  handleAuthRequest() {
    wx.getUserProfile({
      desc: '用于完善您的个人资料和偏好',
      success: (res) => {
        wx.showToast({ title: '授权成功', icon: 'success' });
        wx.setStorageSync('userInfo', res.userInfo);
        this.setData({ 
          showAuthModal: false,
          prefilledInfo: res.userInfo // 预填信息，以便问卷使用
        });
        // 授权成功后，再检查问卷状态
        this.checkSurveyStatus();
      },
      fail: () => {
        wx.showToast({ title: '授权后可获得更好体验', icon: 'none' });
      }
    });
  },

  onReady() {
    // onReady 中可以进行一些初始化，但监听器启动/停止放在 onShow/onHide 中
  },

  onShow() {
    // 页面显示时，注册对 agentTip 的监听
    getApp().registerAgentTipListener(this.agentTipUpdateHandler);
    // 页面显示时，立即用全局数据刷新一次，以防错过离线时的更新
    this.setData({ currentTip: getApp().globalData.agentTip });
  },

  onHide() {
    // 页面隐藏时，取消注册，避免内存泄漏和不必要的后台更新
    getApp().unregisterAgentTipListener(this.agentTipUpdateHandler);
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
      // 微信新规：wx.getUserProfile 必须由用户点击触发
      // 因此，我们先显示问卷/授权提示，让用户点击按钮后才调用授权
      this.setData({ 
        showSurvey: true 
      });
    }
  },

  

  onSurveySubmit(e) {
    const surveyResult = e.detail;
    console.log('问卷结果:', surveyResult);
    // 数据上传逻辑已移至 survey-modal.js 组件内部处理
    // 因此此处不再需要调用 uploadDataToServer
    wx.setStorageSync('surveyCompleted', true);
    this.setData({ showSurvey: false });
    wx.showToast({ title: '感谢您的反馈！', icon: 'success' });
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
