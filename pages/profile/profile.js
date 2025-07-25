// pages/profile/profile.js
Page({
  data: {
    userInfo: null,
    hasUserInfo: false,
    canIUseGetUserProfile: false,
    settings: {
      notificationEnabled: true,
      autoSaveEnabled: true,
      highQualityEnabled: false,
      darkModeEnabled: false
    },
    vipInfo: {
      isVip: false,
      expireDate: null,
      remainingCredits: 0
    },
    aboutItems: [
      { id: 'feedback', name: '意见反馈', icon: '/assets/icons/feedback.png' },
      { id: 'privacy', name: '隐私政策', icon: '/assets/icons/privacy.png' },
      { id: 'terms', name: '用户协议', icon: '/assets/icons/terms.png' },
      { id: 'about', name: '关于我们', icon: '/assets/icons/about.png' }
    ]
  },

  onLoad: function() {
    // 检查是否支持getUserProfile
    if (wx.getUserProfile) {
      this.setData({
        canIUseGetUserProfile: true
      });
    }
    
    // 检查是否已有用户信息
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.setData({
        userInfo: userInfo,
        hasUserInfo: true
      });
    }
    
    // 获取设置
    const settings = wx.getStorageSync('settings');
    if (settings) {
      this.setData({
        settings: { ...this.data.settings, ...settings }
      });
    }
    
    // 获取会员信息
    this.getVipInfo();
  },

  getUserProfile: function() {
    if (!this.data.canIUseGetUserProfile) {
      this.getUserInfo();
      return;
    }
    
    wx.getUserProfile({
      desc: '用于完善会员资料',
      success: (res) => {
        // 保存用户信息
        wx.setStorageSync('userInfo', res.userInfo);
        
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true
        });
        
        // 模拟登录
        wx.showLoading({
          title: '登录中...',
        });
        
        setTimeout(() => {
          wx.hideLoading();
          wx.showToast({
            title: '登录成功',
            icon: 'success',
            duration: 1500
          });
        }, 1000);
      },
      fail: (err) => {
        console.error('获取用户信息失败', err);
        wx.showToast({
          title: '获取用户信息失败',
          icon: 'none',
          duration: 2000
        });
      }
    });
  },

  getUserInfo: function() {
    // 兼容旧版本
    wx.getUserInfo({
      success: (res) => {
        // 保存用户信息
        wx.setStorageSync('userInfo', res.userInfo);
        
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true
        });
      },
      fail: (err) => {
        console.error('获取用户信息失败', err);
      }
    });
  },

  getVipInfo: function() {
    // 模拟获取会员信息
    setTimeout(() => {
      // 随机模拟是否为会员
      const isVip = Math.random() > 0.5;
      
      if (isVip) {
        // 生成一个未来的过期日期
        const expireDate = new Date();
        expireDate.setMonth(expireDate.getMonth() + Math.floor(Math.random() * 12) + 1);
        
        this.setData({
          vipInfo: {
            isVip: true,
            expireDate: expireDate.toISOString(),
            remainingCredits: Math.floor(Math.random() * 100) + 10
          }
        });
      } else {
        this.setData({
          vipInfo: {
            isVip: false,
            expireDate: null,
            remainingCredits: Math.floor(Math.random() * 5)
          }
        });
      }
    }, 500);
    
    // 实际API调用示例
    /*
    wx.request({
      url: 'https://your-backend-api.com/user/vip-info',
      method: 'GET',
      header: {
        'Authorization': 'Bearer ' + wx.getStorageSync('token')
      },
      success: (res) => {
        this.setData({
          vipInfo: res.data
        });
      },
      fail: (err) => {
        console.error('获取会员信息失败', err);
      }
    });
    */
  },

  toggleSetting: function(e) {
    const settingKey = e.currentTarget.dataset.setting;
    const newValue = !this.data.settings[settingKey];
    
    // 更新设置
    this.setData({
      [`settings.${settingKey}`]: newValue
    });
    
    // 保存设置到本地
    wx.setStorageSync('settings', this.data.settings);
    
    // 特殊设置处理
    if (settingKey === 'darkModeEnabled') {
      // 处理暗黑模式切换
      if (newValue) {
        wx.setNavigationBarColor({
          frontColor: '#ffffff',
          backgroundColor: '#333333'
        });
      } else {
        wx.setNavigationBarColor({
          frontColor: '#000000',
          backgroundColor: '#ffffff'
        });
      }
    }
  },

  navigateToVip: function() {
    wx.navigateTo({
      url: '/pages/vip/vip'
    });
  },

  handleAboutItemTap: function(e) {
    const itemId = e.currentTarget.dataset.id;
    
    switch (itemId) {
      case 'feedback':
        this.handleFeedback();
        break;
      case 'privacy':
        this.navigateToPage('/pages/webview/webview?url=https://example.com/privacy&title=隐私政策');
        break;
      case 'terms':
        this.navigateToPage('/pages/webview/webview?url=https://example.com/terms&title=用户协议');
        break;
      case 'about':
        this.navigateToPage('/pages/about/about');
        break;
      default:
        break;
    }
  },

  handleFeedback: function() {
    wx.showModal({
      title: '意见反馈',
      content: '感谢您的使用，如有问题或建议，请联系我们：\nsupport@beautycap.com',
      showCancel: false,
      confirmText: '复制邮箱',
      success: (res) => {
        if (res.confirm) {
          wx.setClipboardData({
            data: 'support@beautycap.com',
            success: () => {
              wx.showToast({
                title: '邮箱已复制',
                icon: 'success',
                duration: 1500
              });
            }
          });
        }
      }
    });
  },

  navigateToPage: function(url) {
    wx.navigateTo({
      url: url
    });
  },

  logout: function() {
    wx.showModal({
      title: '退出登录',
      content: '确定要退出当前账号吗？',
      success: (res) => {
        if (res.confirm) {
          // 清除用户信息
          wx.removeStorageSync('userInfo');
          wx.removeStorageSync('token');
          
          this.setData({
            userInfo: null,
            hasUserInfo: false,
            vipInfo: {
              isVip: false,
              expireDate: null,
              remainingCredits: 0
            }
          });
          
          wx.showToast({
            title: '已退出登录',
            icon: 'success',
            duration: 1500
          });
        }
      }
    });
  },

  formatDate: function(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }
})