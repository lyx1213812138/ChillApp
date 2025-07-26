function setUserConf() {
    wx.setStorageSync('userConfig', nowConf);
}

function getUserConf() {
    return wx.getStorageSync('userConfig');
}

async function audioPlayFrame(audioCtx, bufferbefore) {
  const decodeAsync = () => {
    new Promise((resolve, reject) => {
      audioCtx.decodeAudioData(bufferbefore, buffer => {
        resolve(buffer);
      }, err => {
        throw Error('decodeAudioData fail', err);
      });
    });
  };
  const buffer = await decodeAsync();
  const source = audioCtx.createBufferSource();
  source.buffer = buffer;
  source.connect(audioCtx.destination);
  source.start();
  return source;
}

async function audioPlayInit(audioCtx, queue, cb) {
    if (queue.length === 0) return;
    let sourceNode = null;
    const play = async () => {
      console.log('playing')
      sourceNode = await audioPlayFrame(audioCtx, queue.shift());
      sourceNode.onEnd(() => {
        if (queue.length === 0) {
          cb();
        } else {
          play();
        }
      })  
    }
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
    url: 'http://172.20.10.2:8000/pictureStream',
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



module.exports = {
  audioPlayInit,
  startPostImage,
  stopPostImage,
  postPicture,
  requestFeishuAccessToken,
  searchFeishuBitableRecords,
  createFeishuBitableRecord,
}
