Page({
  data: {
    userInfo: null,
    surveyResult: null,
    genders: ['男', '女']
  },

  onLoad: function() {
    // 从本地存储中获取用户信息和问卷结果
    const userInfo = wx.getStorageSync('userInfo');
    const surveyResult = wx.getStorageSync('surveyResult');

    if (userInfo) {
      this.setData({
        userInfo: userInfo
      });
    }

    if (surveyResult) {
      this.setData({
        surveyResult: surveyResult
      });
    }
  }
});
