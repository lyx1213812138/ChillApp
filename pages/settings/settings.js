// pages/settings/settings.js
Page({

  /**
   * Page initial data
   */
  data: {
    userInfo: {
      nickName: '',
      userId: ''
    },
    permissions: {
      camera: true,
      storage: true,
      location: false,
      background: false
    },
    devices: [
      {
        id: 'device001',
        name: '家用摄像头',
        icon: '/assets/icons/camera.png',
        connected: true
      },
      {
        id: 'device002',
        name: '办公室摄像头',
        icon: '/assets/icons/camera.png',
        connected: false
      }
    ],
    cloudSync: false,
    version: '1.0.0'
  },

  /**
   * Lifecycle function--Called when page load
   */
  onLoad(options) {
    this.getUserInfo();
    this.getPermissionsStatus();
  },

  /**
   * 获取用户信息
   */
  getUserInfo() {
    // 这里应该从本地存储或服务器获取用户信息
    // 示例代码，实际应用中需要替换为真实的用户信息获取逻辑
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.setData({
        userInfo: userInfo
      });
    }
  },

  /**
   * 获取权限状态
   */
  getPermissionsStatus() {
    // 这里应该获取实际的权限状态
    // 示例代码，实际应用中需要替换为真实的权限检查逻辑
    wx.getSetting({
      success: (res) => {
        const permissions = {
          camera: res.authSetting['scope.camera'] || false,
          storage: res.authSetting['scope.writePhotosAlbum'] || false,
          location: res.authSetting['scope.userLocation'] || false,
          background: wx.getStorageSync('backgroundPermission') || false
        };
        
        this.setData({
          permissions: permissions
        });
      }
    });
  },

  /**
   * 处理用户点击个人信息区域的事件
   */
  handleUserProfileTap() {
    if (this.data.userInfo && this.data.userInfo.nickName) {
      // 如果已登录，则跳转到个人资料页
      wx.navigateTo({ url: '/pages/profile/profile' });
    } else {
      // 如果未登录，则调用微信登录
      wx.getUserProfile({
        desc: '用于完善会员资料', // 声明获取用户个人信息后的用途，后续会展示在弹窗中，请谨慎填写
        success: (res) => {
          const userInfo = {
            ...res.userInfo,
            // 你可以在这里添加自定义的userId或其他信息
            userId: 'user_' + Date.now()
          };
          this.setData({
            userInfo: userInfo
          });
          wx.setStorageSync('userInfo', userInfo);
          wx.showToast({ title: '登录成功', icon: 'success' });
        },
        fail: (err) => {
          console.error('用户拒绝授权:', err);
          wx.showToast({ title: '您拒绝了授权', icon: 'none' });
        }
      });
    }
  },

  /**
   * 切换权限状态
   */
  togglePermission(e) {
    const type = e.currentTarget.dataset.type;
    const value = e.detail.value;
    
    // 更新本地数据
    const permissions = this.data.permissions;
    permissions[type] = value;
    
    this.setData({
      permissions: permissions
    });
    
    // 根据权限类型处理不同的权限请求
    switch(type) {
      case 'camera':
        if (value) {
          wx.authorize({
            scope: 'scope.camera',
            success: () => {
              wx.showToast({
                title: '相机权限已开启',
                icon: 'success'
              });
            },
            fail: () => {
              // 如果用户拒绝授权，引导用户去设置页面开启
              this.openSettingPage('相机');
              // 恢复开关状态
              permissions[type] = false;
              this.setData({
                permissions: permissions
              });
            }
          });
        }
        break;
      case 'storage':
        if (value) {
          wx.authorize({
            scope: 'scope.writePhotosAlbum',
            success: () => {
              wx.showToast({
                title: '存储权限已开启',
                icon: 'success'
              });
            },
            fail: () => {
              this.openSettingPage('存储');
              permissions[type] = false;
              this.setData({
                permissions: permissions
              });
            }
          });
        }
        break;
      case 'location':
        if (value) {
          wx.authorize({
            scope: 'scope.userLocation',
            success: () => {
              wx.showToast({
                title: '位置权限已开启',
                icon: 'success'
              });
            },
            fail: () => {
              this.openSettingPage('位置');
              permissions[type] = false;
              this.setData({
                permissions: permissions
              });
            }
          });
        }
        break;
      case 'background':
        // 后台运行权限需要特殊处理，这里只是示例
        wx.setStorageSync('backgroundPermission', value);
        wx.showToast({
          title: value ? '后台运行已开启' : '后台运行已关闭',
          icon: 'success'
        });
        break;
    }
  },

  /**
   * 打开设置页面
   */
  openSettingPage(permissionName) {
    wx.showModal({
      title: '权限申请',
      content: `需要您授权${permissionName}权限，是否去设置页面开启？`,
      success: (res) => {
        if (res.confirm) {
          wx.openSetting();
        }
      }
    });
  },

  /**
   * Lifecycle function--Called when page is initially rendered
   */
  onReady() {

  },

  /**
   * Lifecycle function--Called when page show
   */
  onShow() {
    // 页面显示时重新获取权限和用户信息，确保数据最新
    this.getPermissionsStatus();
    this.getUserInfo();
  },

  /**
   * 管理设备
   */
  manageDevice(e) {
    const deviceId = e.currentTarget.dataset.deviceId;
    const device = this.data.devices.find(item => item.id === deviceId);
    
    if (device) {
      let itemList = [];
      if (device.connected) {
        itemList = ['查看详情', '重命名', '断开连接', '删除设备'];
      } else {
        itemList = ['连接设备'];
      }
      wx.showActionSheet({
        itemList,
        success: (res) => {
          if (device.connected) {
            switch(res.tapIndex) {
              case 0: // 查看详情
                wx.showToast({
                  title: '查看设备详情: ' + device.name,
                  icon: 'none'
                });
                break;
              case 1: // 重命名
                this.renameDevice(deviceId);
                break;
              case 2: // 断开连接
                this.disconnectDevice(deviceId);
                break;
              case 3: // 删除设备
                this.deleteDevice(deviceId);
                break;
            }
          } else {
            if (res.tapIndex === 0) {
              // 跳转到连接设备页面
              wx.navigateTo({
                url: '/pages/connect-device/connect-device',
              });
            }
          }
        }
      });
    }
  },

  /**
   * 重命名设备
   */
  renameDevice(deviceId) {
    wx.showModal({
      title: '重命名设备',
      editable: true,
      placeholderText: '请输入新的设备名称',
      success: (res) => {
        if (res.confirm && res.content) {
          const devices = this.data.devices.map(item => {
            if (item.id === deviceId) {
              return { ...item, name: res.content };
            }
            return item;
          });
          
          this.setData({
            devices: devices
          });
          
          wx.showToast({
            title: '重命名成功',
            icon: 'success'
          });
        }
      }
    });
  },

  /**
   * 断开设备连接
   */
  disconnectDevice(deviceId) {
    wx.showLoading({
      title: '断开连接中...',
    });
    
    // 模拟断开连接过程
    setTimeout(() => {
      const devices = this.data.devices.map(item => {
        if (item.id === deviceId) {
          return { ...item, connected: false };
        }
        return item;
      });
      
      this.setData({
        devices: devices
      });
      
      wx.hideLoading();
      wx.showToast({
        title: '已断开连接',
        icon: 'success'
      });
    }, 1000);
  },

  /**
   * 删除设备
   */
  deleteDevice(deviceId) {
    wx.showModal({
      title: '删除设备',
      content: '确定要删除此设备吗？',
      success: (res) => {
        if (res.confirm) {
          const devices = this.data.devices.filter(item => item.id !== deviceId);
          
          this.setData({
            devices: devices
          });
          
          wx.showToast({
            title: '设备已删除',
            icon: 'success'
          });
        }
      }
    });
  },

  /**
   * 添加新设备
   */
  addNewDevice() {
    wx.navigateTo({
      url: '/pages/connect-device/connect-device',
    });
  },

  /**
   * Lifecycle function--Called when page hide
   */
  onHide() {

  },

  /**
   * Lifecycle function--Called when page unload
   */
  onUnload() {

  },

  /**
   * Page event handler function--Called when user drop down
   */
  onPullDownRefresh() {
    // 下拉刷新时重新获取数据
    this.getUserInfo();
    this.getPermissionsStatus();
    
    setTimeout(() => {
      wx.stopPullDownRefresh();
    }, 1000);
  },

  /**
   * Called when page reach bottom
   */
  onReachBottom() {

  },

  /**
   * Called when user click on the top right corner to share
   */
  onShareAppMessage() {

  },

  /**
   * 配置WIFI连接
   */
  configureWifi() {
    wx.showToast({
      title: '跳转到WIFI配置页面',
      icon: 'none'
    });
    // 实际应用中应该跳转到WIFI配置页面
    // wx.navigateTo({
    //   url: '/pages/wifi-config/wifi-config',
    // });
  },

  /**
   * 配置热点连接
   */
  configureHotspot() {
    wx.showToast({
      title: '跳转到热点配置页面',
      icon: 'none'
    });
    // 实际应用中应该跳转到热点配置页面
    // wx.navigateTo({
    //   url: '/pages/hotspot-config/hotspot-config',
    // });
  },

  /**
   * 切换云端同步
   */
  toggleCloudSync(e) {
    const value = e.detail.value;
    
    this.setData({
      cloudSync: value
    });
    
    wx.showToast({
      title: value ? '云端同步已开启' : '云端同步已关闭',
      icon: 'success'
    });
  },

  /**
   * 导航到账号安全页面
   */
  navigateToAccountSecurity() {
    wx.showToast({
      title: '跳转到账号安全页面',
      icon: 'none'
    });
    // 实际应用中应该跳转到账号安全页面
    // wx.navigateTo({
    //   url: '/pages/account-security/account-security',
    // });
  },

  /**
   * 导航到隐私设置页面
   */
  navigateToPrivacy() {
    wx.showToast({
      title: '跳转到隐私设置页面',
      icon: 'none'
    });
    // 实际应用中应该跳转到隐私设置页面
    // wx.navigateTo({
    //   url: '/pages/privacy/privacy',
    // });
  },

  /**
   * 显示关于我们
   */
  showAbout() {
    wx.showModal({
      title: '关于我们',
      content: 'BeautyCap 1.0.0\n一款专业的美颜相机应用\n\n© 2023 BeautyCap Team',
      showCancel: false
    });
  },

  /**
   * 检查更新
   */
  checkUpdate() {
    wx.showLoading({
      title: '检查更新中...',
    });
    
    // 模拟检查更新过程
    setTimeout(() => {
      wx.hideLoading();
      wx.showModal({
        title: '检查更新',
        content: '当前已是最新版本',
        showCancel: false
      });
    }, 1000);
  }
})