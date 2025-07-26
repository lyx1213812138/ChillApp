const util = require('../../utils/util.js');
const { APP_ID, APP_SECRET, APP_TOKEN, TABLE_ID } = require('../../utils/config.js');
const { maleImageStyles, femaleImageStyles } = require('../../utils/style_config.js');

Component({
  properties: {
    show: {
      type: Boolean,
      value: false
    },
    prefilledInfo: {
      type: Object,
      value: null,
      observer: function(newVal) {
        if (newVal) {
          this.setData({
            'userInfo.avatarUrl': newVal.avatarUrl,
            'userInfo.nickName': newVal.nickName
          });
        }
      }
    }
  },

  data: {
    step: 1, // 1: 基本信息, 2: 拍照偏好
    userInfo: {
      avatarUrl: '', // 初始值设为空
      nickName: '',
      gender: null, // 初始值设为 null，表示未选择
      birthday: ''
    },
    genders: ['男', '女'],
    displayStyles: [],
    maleImageStyles: maleImageStyles.map(s => ({...s})),
    femaleImageStyles: femaleImageStyles.map(s => ({...s})),
    selectedStyles: []
  },

  methods: {
    onChooseAvatar(e) {
      this.setData({ 'userInfo.avatarUrl': e.detail.avatarUrl });
    },

    onNicknameInput(e) {
      this.setData({ 'userInfo.nickName': e.detail.value });
    },

    onGenderChange(e) {
      this.setData({ 'userInfo.gender': parseInt(e.detail.value, 10) });
    },

    onBirthdayChange(e) {
      this.setData({ 'userInfo.birthday': e.detail.value });
    },

    nextStep() {
      // 在进入下一步时，将收集到的用户信息存入本地缓存
      wx.setStorageSync('userInfo', this.data.userInfo);

      const stylesToDisplay = this.data.userInfo.gender === 0 ? this.data.maleImageStyles : this.data.femaleImageStyles;
      this.setData({ displayStyles: stylesToDisplay, step: 2 });
    },

    selectStyle(e) {
      const id = parseInt(e.currentTarget.dataset.id, 10);
      const updatedStyles = this.data.displayStyles.map(style => {
        if (style.id === id) {
          return { ...style, selected: !style.selected };
        }
        return style;
      });

      const selectedStyles = updatedStyles.filter(style => style.selected).map(style => style.id);

      this.setData({ displayStyles: updatedStyles, selectedStyles: selectedStyles });
    },

    submitSurvey() {
      const surveyResult = {
        userInfo: this.data.userInfo,
        preferredStyles: this.data.selectedStyles,
        // 将问卷组件内部的一些数据也打包，以便下一页使用
        internalData: {
          genders: this.data.genders,
          maleImageStyles: this.data.maleImageStyles,
          femaleImageStyles: this.data.femaleImageStyles
        }
      };

      // 触发父组件的 submit 事件，并将结果传递出去
      this.triggerEvent('submit', surveyResult);
    }
  }
});
