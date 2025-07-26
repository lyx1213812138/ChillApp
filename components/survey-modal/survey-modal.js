const util = require('../../utils/util.js');
const { APP_ID, APP_SECRET, APP_TOKEN, TABLE_ID, IMAGE_APP_TOKEN, IMAGE_TABLE_ID } = require('../../utils/config.js');
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

    async submitSurvey() {
      wx.showLoading({ title: '正在提交...', mask: true });

      try {
        // Step 1: Wait for all image uploads to complete.
        await this.uploadSelectedImages();

        // Step 2: If uploads are successful, prepare the final result.
        const surveyResult = {
          userInfo: this.data.userInfo,
          preferredStyles: this.data.selectedStyles,
          internalData: {
            genders: this.data.genders,
            maleImageStyles: this.data.maleImageStyles,
            femaleImageStyles: this.data.femaleImageStyles
          }
        };

        wx.hideLoading();
        
        // Step 3: Trigger the event to notify the parent page.
        this.triggerEvent('submit', surveyResult);

      } catch (err) {
        // If any upload fails, catch the error here.
        wx.hideLoading();
        console.error('图片上传过程中断:', err);
        wx.showToast({ title: '图片上传失败，请重试', icon: 'none' });
      }
    },

    uploadSelectedImages() {
      const selectedImages = this.data.displayStyles.filter(style => style.selected);
      const wxid = 'user_' + Date.now();

      if (selectedImages.length === 0) {
        return Promise.resolve();
      }

      const uploadPromises = selectedImages.map(image => {
        return util.uploadImageToFeishu({
          filePath: image.src,
          pic_id: `style_${image.id}`,
          wxid: wxid,
          appId: APP_ID,
          appSecret: APP_SECRET,
          appToken: IMAGE_APP_TOKEN,
          tableId: IMAGE_TABLE_ID
        });
      });

      return Promise.all(uploadPromises);
    }
  }
});
