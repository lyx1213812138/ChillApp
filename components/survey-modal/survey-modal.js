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
    maleImageStyles: [
      { id: 1, src: '/assets/survey-images/male/style1.jpg', selected: false, name: '运动街头' },
      { id: 2, src: '/assets/survey-images/male/style2.jpg', selected: false, name: '复古港风' },
      { id: 3, src: '/assets/survey-images/male/style3.jpg', selected: false, name: '简约商务' },
      { id: 4, src: '/assets/survey-images/male/style4.jpg', selected: false, name: '户外探险' },
      { id: 5, src: '/assets/survey-images/male/style5.jpg', selected: false, name: '文艺清新' },
      { id: 6, src: '/assets/survey-images/male/style6.jpg', selected: false, name: '暗黑机能' },
      { id: 7, src: '/assets/survey-images/male/style7.jpg', selected: false, name: '假日海滩' },
      { id: 8, src: '/assets/survey-images/male/style8.jpg', selected: false, name: '居家生活' },
      { id: 9, src: '/assets/survey-images/male/style9.jpg', selected: false, name: '潮流工装' }
    ],
    femaleImageStyles: [
      { id: 1, src: '/assets/survey-images/female/style1.jpg', selected: false, name: '清新自然' },
      { id: 2, src: '/assets/survey-images/female/style2.jpg', selected: false, name: '复古胶片' },
      { id: 3, src: '/assets/survey-images/female/style3.jpg', selected: false, name: '黑白纪实' },
      { id: 4, src: '/assets/survey-images/female/style4.jpg', selected: false, name: '都市夜景' },
      { id: 5, src: '/assets/survey-images/female/style5.jpg', selected: false, name: '甜美日系' },
      { id: 6, src: '/assets/survey-images/female/style6.jpg', selected: false, name: '简约ins' },
      { id: 7, src: '/assets/survey-images/female/style7.jpg', selected: false, name: '浓郁油画' },
      { id: 8, src: '/assets/survey-images/female/style8.jpg', selected: false, name: '赛博朋克' },
      { id: 9, src: '/assets/survey-images/female/style9.jpg', selected: false, name: '国风古韵' }
    ],
    selectedStyles: []
  },

  methods: {
    triggerAuthorize() {
      this.triggerEvent('authorize');
    },

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
        preferredStyles: this.data.selectedStyles
      };
      this.triggerEvent('submit', surveyResult);
      this.setData({ show: false });
    }
  }
});
