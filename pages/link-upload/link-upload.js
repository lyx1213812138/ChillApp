// pages/link-upload/link-upload.js
const util = require('../../utils/util.js');
const { APP_ID, APP_SECRET, APP_TOKEN, TABLE_ID, difyId } = require('../../utils/config.js');

Page({
  data: {
    rurl: '', // 用户输入的链接
    surveyResult: null // 从上一个页面接收的问卷结果
  },

  onLoad: function (options) {
    const eventChannel = this.getOpenerEventChannel();
    eventChannel.on('acceptSurveyResult', (data) => {
      console.log('接收到问卷结果:', data.surveyResult);
      this.setData({
        surveyResult: data.surveyResult
      });
    });
  },

  onLinkInput: function(e) {
    this.setData({
      rurl: e.detail.value
    });
  },

  submitLink: function() {
    this.uploadAllDataToFeishu(this.data.rurl);
  },

  skip: function() {
    this.uploadAllDataToFeishu(''); // 跳过时，链接传空字符串
  },

  uploadAllDataToFeishu: async function(rurl) {
    if (!this.data.surveyResult) {
      wx.showToast({ title: '问卷数据丢失，请重试', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '正在保存...', mask: true });

    const { userInfo, preferredStyles } = this.data.surveyResult;
    const { genders, maleImageStyles, femaleImageStyles } = this.data.surveyResult.internalData; // 获取内部数据

    // --- 数据适配，以匹配 util.js 的要求 ---
    let age = null;
    if (userInfo.birthday) {
      const birthDate = new Date(userInfo.birthday);
      const today = new Date();
      age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
    }

    const sex = genders[userInfo.gender];
    const styleList = (userInfo.gender === 0) ? maleImageStyles : femaleImageStyles;
    const styleMap = new Map(styleList.map(style => [style.id, style.name]));
    const conf = preferredStyles.map(id => styleMap.get(id)).filter(Boolean).join(', ');
    const wxid = 'submission_' + Date.now().toString(36) + Math.random().toString(36).substr(2);

    // --- 调用封装好的飞书上传方法 ---
    util.createFeishuBitableRecord({
      appId: APP_ID,
      appSecret: APP_SECRET,
      appToken: APP_TOKEN,
      tableId: TABLE_ID,
      age: age,
      sex: sex,
      conf: conf,
      wxid: wxid,
      rurl: rurl
    }).then(async () => {
      wx.hideLoading();
      wx.showToast({ title: '提交成功！', icon: 'success' });
      // 标记问卷已完成并返回首页
      wx.setStorageSync('surveyCompleted', true);
      setTimeout(() => {
        wx.switchTab({ url: '/pages/index/index' });
      }, 1500);
      const accessToken = await util.requestFeishuAccessToken({ appId: APP_ID, appSecret: APP_SECRET });
      wx.request({
        url: 'https://api.dify.ai/v1/workflows/run',
        method: 'POST',
        header: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${difyId}`
        },
        data: {
          inputs: {
            user_age: age,
            user_sex: sex,
            user_default_style: conf,
            user_wxid: wxid,
            CONST_FEISHU_BEAR: accessToken
          },
          response_mode: 'blocking',
          user: wxid
        },
        success: (res) => {
          console.log('Dify AI workflow run response:', res);
          if (res.statusCode === 200) {
            console.log('Dify AI workflow run success:', res.data);
            try {
              // 获取页面栈，找到首页实例
              const pages = getCurrentPages();
              const indexPage = pages.find(p => p.route === 'pages/index/index');
              if (indexPage) {
                indexPage.setData({ currentTip: res.data.data.outputs.showToUser || '' });
              }
            } catch (e) {
              console.error('响应式设置 currentTip 失败:', e);
            }
            
            
          } else {
            console.error('Dify AI workflow run failed:', res);
          }
        },
        fail: (err) => {
          console.error('Dify AI workflow run request failed:', err);
        }
      });
    }).catch(err => {
      wx.hideLoading();
      wx.showToast({ title: '提交失败，请重试', icon: 'none' });
      console.error('上传飞书失败:', err);
    });

    
   
  }
});
