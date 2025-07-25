// preview.js
Page({
  data: {
    imagePath: '', // 照片路径
    isSaving: false, // 是否正在保存
    showShareMenu: false, // 是否显示分享菜单
    filters: [
      { name: '原图', class: 'filter-original', active: true },
      { name: '明亮', class: 'filter-bright', active: false },
      { name: '暖色', class: 'filter-warm', active: false },
      { name: '冷色', class: 'filter-cool', active: false },
      { name: '复古', class: 'filter-vintage', active: false }
    ],
    activeFilter: 'filter-original'
  },
  
  onLoad: function(options) {
    if (options.imagePath) {
      this.setData({
        imagePath: options.imagePath
      });
    } else {
      wx.showToast({
        title: '加载图片失败',
        icon: 'none',
        duration: 2000
      });
      
      // 返回上一页
      setTimeout(() => {
        wx.navigateBack();
      }, 2000);
    }
  },
  
  // 返回相机页面
  backToCamera: function() {
    wx.navigateBack();
  },
  
  // 保存照片到相册
  saveToAlbum: function() {
    if (this.data.isSaving) return;
    
    this.setData({
      isSaving: true
    });
    
    wx.saveImageToPhotosAlbum({
      filePath: this.data.imagePath,
      success: () => {
        wx.showToast({
          title: '已保存到相册',
          icon: 'success'
        });
        
        this.setData({
          isSaving: false
        });
      },
      fail: (err) => {
        console.error('保存到相册失败：', err);
        
        wx.showToast({
          title: '保存失败，请检查权限设置',
          icon: 'none'
        });
        
        this.setData({
          isSaving: false
        });
      }
    });
  },
  
  // 切换分享菜单
  toggleShareMenu: function() {
    this.setData({
      showShareMenu: !this.data.showShareMenu
    });
  },
  
  // 应用滤镜
  applyFilter: function(e) {
    const filterIndex = e.currentTarget.dataset.index;
    const filters = this.data.filters.map((filter, index) => {
      return {
        ...filter,
        active: index === filterIndex
      };
    });
    
    this.setData({
      filters: filters,
      activeFilter: filters[filterIndex].class
    });
  },
  
  // 分享到朋友圈（实际上微信小程序不支持直接分享到朋友圈，这里只是示例）
  shareToTimeline: function() {
    wx.showToast({
      title: '微信小程序暂不支持直接分享到朋友圈',
      icon: 'none',
      duration: 2000
    });
    
    this.setData({
      showShareMenu: false
    });
  },
  
  // 分享给朋友
  shareToFriend: function() {
    // 关闭分享菜单
    this.setData({
      showShareMenu: false
    });
    
    // 微信小程序的分享功能通过onShareAppMessage实现
  },
  
  // 分享给朋友的回调函数
  onShareAppMessage: function() {
    return {
      title: '我用BeautyCap拍了一张美照',
      path: '/pages/index/index',
      imageUrl: this.data.imagePath
    };
  }
});