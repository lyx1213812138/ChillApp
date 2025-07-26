import { maleImageStyles, femaleImageStyles } from '../../utils/style_config.js';

Page({
  data: {
    userInfo: null,
    surveyResult: null,
    genders: ['男', '女'],
    preferredStyleNames: [] // 新增：用于存放转换后的风格名称
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
        surveyResult: surveyResult,
        preferredStyleNames: this.mapStyleIdsToNames(surveyResult)
      });
    }
  },

  mapStyleIdsToNames: function(surveyResult) {
    if (!surveyResult || !surveyResult.preferredStyles || !surveyResult.userInfo) {
      return [];
    }

    const genderIndex = surveyResult.userInfo.gender;
    const styleIds = surveyResult.preferredStyles;
    
    // 根据性别选择对应的风格列表
    const styleList = (genderIndex === 0) ? maleImageStyles : femaleImageStyles;

    // 创建一个从 id 到 name 的映射，以提高查找效率
    const styleMap = new Map(styleList.map(style => [style.id, style.name]));

    // 根据 id 数组查找并返回名称数组
    return styleIds.map(id => styleMap.get(id)).filter(Boolean); // filter(Boolean) 用于过滤掉未找到的项
  }
});
