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
      avatarUrl: '/assets/icons/user.png', // 默认头像
      nickName: '',
      gender: null, // 初始值设为 null，表示未选择
      birthday: ''
    },
    genders: ['男', '女'],
    displayStyles: [], // 新增：用于渲染的图片数组
    // 样式定义已移至 style_config.js
    maleImageStyles: maleImageStyles.map(s => ({...s})), // 浅拷贝一份，避免组件间互相影响
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
      if (!this.data.userInfo.nickName) {
        wx.showToast({ title: '请先点击授权', icon: 'none' });
        return;
      }
      if (this.data.userInfo.gender === null) {
        wx.showToast({ title: '请选择性别', icon: 'none' });
        return;
      }

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

      // 跳转到链接上传页面，并通过 eventChannel 传递数据
      wx.navigateTo({
        url: '/pages/link-upload/link-upload',
        success: (res) => {
          // 通过eventChannel向被打开页面传送数据
          res.eventChannel.emit('acceptSurveyResult', { surveyResult: surveyResult })
        }
      });

      // 关闭当前的弹窗
      this.setData({ show: false });
    }
  }
});
