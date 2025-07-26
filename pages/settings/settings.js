// pages/settings/settings.js
Page({
  data: {
    userInfo: null,
    permissions: {
      camera: false,
      storage: false,
      location: false,
      background: false
    },
    version: '1.0.1' // 假设版本号
  },

  onShow() {
    // 每次进入页面都重新获取最新的用户信息和权限状态
    this.getUserInfo();
    this.getPermissionsStatus();
  },

  /**
   *
   * 获取用户信息
   */
  getUserInfo() {
    const userInfo = wx.getStorageSync('userInfo');
    this.setData({ userInfo: userInfo || null });
  },

  /**
   *
   * 获取权限状态
   */
  getPermissionsStatus() {
    wx.getSetting({
      success: (res) => {
        this.setData({
          'permissions.camera': res.authSetting['scope.camera'] || false,
          'permissions.storage': res.authSetting['scope.writePhotosAlbum'] || false,
          'permissions.location': res.authSetting['scope.userLocation'] || false,
          // 后台运行权限没有标准API，这里依然从缓存读取，但这是非标准的
          'permissions.background': wx.getStorageSync('backgroundPermission') || false
        });
      }
    });
  },

  /**
   *
   * 处理用户点击个人信息区域的事件
   */
  handleUserProfileTap() {
    if (this.data.userInfo) {
      // 如果已登录，则跳转到个人资料页
      wx.navigateTo({ url: '/pages/profile/profile' });
    } else {
      // 如果未登录，提示用户去首页完成登录
      wx.showToast({
        title: '请在首页完成登录授权',
        icon: 'none'
      });
    }
  },

  /**
   *
   * 切换权限状态
   */
  togglePermission(e) {
    const type = e.currentTarget.dataset.type;
    // switch组件的点击事件会改变值，但我们需要通过授权结果来确定最终状态，
    // 所以先获取当前应该的状态，授权失败则恢复
    const currentStatus = this.data.permissions[type];

    if (currentStatus) {
        // 如果当前是开启状态，则引导用户去设置页关闭
        this.openSettingPage();
        return;
    }

    let scope = '';
    switch(type) {
        case 'camera': scope = 'scope.camera'; break;
        case 'storage': scope = 'scope.writePhotosAlbum'; break;
        case 'location': scope = 'scope.userLocation'; break;
        default: break;
    }

    if (scope) {
        wx.authorize({
            scope: scope,
            success: () => {
                this.getPermissionsStatus(); // 授权成功后刷新状态
            },
            fail: () => {
                this.openSettingPage(); // 失败则引导去设置页
                this.getPermissionsStatus(); // 无论如何都刷新一下，以防用户在设置页操作
            }
        });
    } else if (type === 'background') {
        // 后台运行权限没有标准API，这里仅为示例
        const newStatus = !this.data.permissions.background;
        wx.setStorageSync('backgroundPermission', newStatus);
        this.setData({ 'permissions.background': newStatus });
    }
  },

  /**
   *
   * 打开小程序设置页面
   */
  openSettingPage() {
    wx.openSetting();
  },

  /**
   *
   * 跳转到设备管理页面
   */
  navigateToDevicePage() {
    wx.navigateTo({ url: '/pages/device/device' });
  },

  /**
   *
   * 显示关于我们
   */
  showAbout() {
    wx.showModal({
      title: '关于我们',
      content: 'BeautyCap 1.0.1\n一款AI摄影助手',
      showCancel: false
    });
  },

  /**
   *
   * 检查更新
   */
  checkUpdate() {
    const updateManager = wx.getUpdateManager();
    updateManager.onCheckForUpdate((res) => {
      if (res.hasUpdate) {
        wx.showLoading({ title: '下载新版本中...' });
      } else {
        wx.showToast({ title: '当前已是最新版本', icon: 'none' });
      }
    });
    updateManager.onUpdateReady(() => {
      wx.hideLoading();
      wx.showModal({
        title: '更新提示',
        content: '新版本已经准备好，是否重启应用？',
        success: (res) => {
          if (res.confirm) {
            updateManager.applyUpdate();
          }
        }
      });
    });
    updateManager.onUpdateFailed(() => {
      wx.hideLoading();
      wx.showToast({ title: '新版本下载失败', icon: 'none' });
    });
  }
});