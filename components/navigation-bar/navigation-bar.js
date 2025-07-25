Component({
  properties: {
    extClass: String,
    ios: {
      type: Boolean,
      value: false
    },
    color: {
      type: String,
      value: '#000'
    },
    background: {
      type: String,
      value: '#fff'
    },
    displayStyle: {
      type: String,
      value: ''
    },
    innerPaddingRight: {
      type: String,
      value: ''
    },
    safeAreaTop: {
      type: String,
      value: ''
    },
    leftWidth: {
      type: String,
      value: ''
    },
    back: {
      type: Boolean,
      value: false
    },
    homeButton: {
      type: Boolean,
      value: false
    },
    title: String,
    loading: {
      type: Boolean,
      value: false
    }
  },

  data: {
    styleStr: ''
  },

  observers: {
    // 监听属性变更，动态拼接样式
    'color, background, displayStyle, innerPaddingRight, safeAreaTop': function (color, background, displayStyle, innerPaddingRight, safeAreaTop) {
      const styleParts = [
        `color: ${color};`,
        `background: ${background};`,
        displayStyle,
        innerPaddingRight,
        safeAreaTop
      ].filter(Boolean); // 去除空字符串

      this.setData({
        styleStr: styleParts.join(' ')
      });
    }
  },

  methods: {
    back() {
      wx.navigateBack({ delta: 1 });
    },
    home() {
      wx.reLaunch({ url: '/pages/index/index' }); // 修改成你首页路径
    }
  }
});
