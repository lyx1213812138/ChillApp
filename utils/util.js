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
  listener.stop();
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


module.exports = {
  audioPlayInit,
  startPostImage,
  stopPostImage
}
