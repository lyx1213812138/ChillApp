const privatedata = require("../privatedata");

function setUserConf() {
    wx.setStorageSync('userConfig', nowConf);
}

function getUserConf() {
    return wx.getStorageSync('userConfig');
}

async function audioPlayFrame(audioCtx, bufferbefore) {
  const decodeAsync = () => {
    return new Promise((resolve, reject) => {
      audioCtx.decodeAudioData(bufferbefore, buffer => {
        resolve(buffer);
      }, err => {
        throw Error('decodeAudioData fail', err);
      });
    });
  };
  const buffer = await decodeAsync();
  if (!buffer) {
    console.log('decodeAudioData fail', bufferbefore, bufferbefore.byteLength);
  } else {
      console.log('decodeAudioData success', buffer)
  }
  // const buffer = codeWAV(bufferbefore, 1, 16000);
//   const buffer = bufferbefore;
  const source = audioCtx.createBufferSource();
  source.buffer = buffer;
  source.connect(audioCtx.destination);
  source.start();
  console.log('sourceNode', source);
  return source;
}

async function audioPlayInit(self, audioCtx, queue, cb) {
    console.log('audioPlayInit', queue)
    if (queue.length === 0) return;
    let sourceNode = null;
    const play = async () => {
      console.log('playing')
      sourceNode = await audioPlayFrame(audioCtx, queue.shift());
      self.globalData.isPlaying = true;
      
      sourceNode.onended = () => {
        if (queue.length === 0) {
          self.globalData.isPlaying = false;
          cb();
        } else {
          play();
        }
      }  
    //   const durationMs = this.data.audioBuffer.duration * 1000;
    //   const timerId = setTimeout(() => {
    //       console.log('音频播放结束 (通过定时器模拟)');
    //       // 在这里执行音频播放结束后的逻辑
    //       // 例如：更新UI，播放下一个音频，或者重置状态等
    //       this.setData({
    //           currentSourceNode: null, // 清理引用
    //           endTimer: null           // 清理定时器ID
    //       });
    //       // 可以在这里调用一个回调函数：this.onAudioEndedCallback();

    //   }, durationMs);
    }
    await play();
}


function startPostImage() {
  const that = this
  const context = wx.createCameraContext()
  const listener = context.onCameraFrame((frame) => {
    if (that.data.canPostImage) {
      console.log('post image: ', frame.data instanceof ArrayBuffer, frame.data.byteLength, frame.width, frame.height, frame);
      postPicture(frame.data);
      that.data.canPostImage = false;
    }
  })
  listener.start()
  return listener;
}

function stopPostImage(listener) {
  // 增加空值检查，防止重复调用或意外调用时报错
  if (listener) {
    listener.stop();
  }
}

// TODO camera里配置压缩，bind事件
function postPicture(imageData) {
  // 发送图片到服务器
  console.log(imageData.byteLength)
  wx.request({
    // url: this.data.httpUrl,
    url: 'http://'+privatedata.connectUrl+'/pictureStream',
    method: 'POST',
    header: {                        
      'content-type': 'application/octet-stream',
      'devType': 'WX',
      'cmd': 'SendPic',
      'picID': Date.now().toString(),
    },
    body: imageData,
    success: (res) => {
      console.log('图片发送状态码:', res.statusCode, res);
    },
    fail: (err) => {
      console.error('图片发送失败:', err);
      wx.showToast({
        title: '图片发送失败',
        icon: 'none',
        duration: 2000
      });
    }
  })
}

function requestFeishuAccessToken(params) {
  return new Promise((resolve, reject) => {
    const { appId, appSecret } = params;
    wx.request({
      url: 'https://open.feishu.cn/open-apis/auth/v3/app_access_token/internal',
      method: 'POST',
      header: {
        'Content-Type': 'application/json'
      },
      data: {
        "app_id": appId,
        "app_secret": appSecret
      },
      success(res) {
        if (res.statusCode === 200 && res.data.code === 0 && res.data.app_access_token) {
          console.log('获取飞书app_access_token成功:', res.data);
          resolve(res.data.app_access_token);
        } else {
          console.error('获取飞书app_access_token失败:', res);
          reject(new Error('获取飞书app_access_token失败'));
        }
      },
      fail(err) {
        console.error('请求失败:', err);
        reject(err);
      }
    });
  });
}

function searchFeishuBitableRecords(params) {
  return new Promise(async (resolve, reject) => {
    const { appToken, tableId, viewId, wxid, pageSize = 20 } = params;
    const accessToken = await requestFeishuAccessToken({ appId: params.appId, appSecret: params.appSecret });
    
    wx.request({
      url: `https://open.feishu.cn/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/records/search?page_size=${pageSize}`,
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      data: {
        "filter": {
          "conditions": [
            {
              "field_name": "wxid",
              "operator": "is",
              "value": [wxid]
            }
          ],
          "conjunction": "and"
        },
        "view_id": viewId
      },
      success(res) {
        if (res.statusCode === 200 && res.data.code === 0) {
          console.log('飞书多维表格记录查询成功:', res.data);
          resolve(res.data.data.records);
        } else {
          console.error('飞书多维表格记录查询失败:', res);
          reject(new Error('飞书多维表格记录查询失败'));
        }
      },
      fail(err) {
        console.error('请求失败:', err);
        reject(err);
      }
    });
  });
}

function createFeishuBitableRecord(params) {
  return new Promise(async (resolve, reject) => {
    const { appToken, tableId, age, conf, sex, wxid, rurl } = params; // 新增 rurl
    console.log(params);
    const accessToken = await requestFeishuAccessToken({ appId: params.appId, appSecret: params.appSecret });
    wx.request({
      url: `https://open.feishu.cn/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/records`,
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      data: {
        "fields": {
          "age": age,
          "conf": conf,
          "sex": sex,
          "wxid": wxid,
          "rurl": rurl // 新增 rurl 字段
        }
      },
      success(res) {
        if (res.statusCode === 200 && res.data.code === 0) {
          console.log('飞书多维表格创建记录成功:', res.data);
          resolve(res.data.data);
        } else {
          console.error('飞书多维表格创建记录失败:', res);
          reject(new Error('飞书多维表格创建记录失败'));
        }
      },
      fail(err) {
        console.error('请求失败:', err);
        reject(err);
      }
    });
  });
}

// 一些工具函数，将数据进行转码、封装
function encodeWAV(samples, numChannels = 1, sampleRate = 16000) {
	var buffer = new ArrayBuffer(44 + samples.byteLength);
	var view = new DataView(buffer);
	/* RIFF identifier */
	writeString(view, 0, 'RIFF');
	/* RIFF chunk length */
	view.setUint32(4, 36 + samples.byteLength, true);
	/* RIFF type */
	writeString(view, 8, 'WAVE');
	/* format chunk identifier */
	writeString(view, 12, 'fmt ');
	/* format chunk length */
	view.setUint32(16, 16, true);
	/* sample format (raw) */
	view.setUint16(20, 1, true);
	/* channel count */
	view.setUint16(22, numChannels, true);
	/* sample rate */
	view.setUint32(24, sampleRate, true);
	/* byte rate (sample rate * block align) */
	view.setUint32(28, sampleRate * 4, true);
	/* block align (channel count * bytes per sample) */
	view.setUint16(32, numChannels * 2, true);
	/* bits per sample */
	view.setUint16(34, 16, true);
	/* data chunk identifier */
	writeString(view, 36, 'data');
	/* data chunk length */
	view.setUint32(40, samples.byteLength, true);

	copyBytes(view, 44, samples);

	return view;
}



module.exports = {
  audioPlayInit,
  startPostImage,
  stopPostImage,
  postPicture,
  requestFeishuAccessToken,
  searchFeishuBitableRecords,
  createFeishuBitableRecord,
  encodeWAV,
}
