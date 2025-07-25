// pages/device/device.js
Page({
  data: {
    devices: [],
    scanning: false,
    connected: false,
    currentDevice: null,
    batteryLevel: null,
    storageInfo: {
      total: 0,
      used: 0,
      free: 0
    },
    showConnectModal: false,
    connectingDeviceId: '',
    errorMessage: ''
  },

  onLoad: function() {
    // 检查是否已有连接的设备
    this.checkConnectedDevice();
  },

  onShow: function() {
    // 每次页面显示时更新设备状态
    if (this.data.connected && this.data.currentDevice) {
      this.updateDeviceStatus();
    }
  },

  checkConnectedDevice: function() {
    // 模拟检查已连接设备
    const app = getApp();
    if (app.globalData && app.globalData.connectedDevice) {
      this.setData({
        connected: true,
        currentDevice: app.globalData.connectedDevice,
        batteryLevel: app.globalData.connectedDevice.batteryLevel || 80,
        storageInfo: app.globalData.connectedDevice.storageInfo || {
          total: 32000,  // MB
          used: 12800,   // MB
          free: 19200    // MB
        }
      });
    }
  },

  startScan: function() {
    if (this.data.scanning) return;
    
    this.setData({
      scanning: true,
      devices: []
    });
    
    // 模拟扫描设备
    setTimeout(() => {
      const mockDevices = this.getMockDevices();
      
      this.setData({
        devices: mockDevices,
        scanning: false
      });
      
      wx.showToast({
        title: '扫描完成',
        icon: 'success',
        duration: 1500
      });
    }, 2000);
    
    // 实际蓝牙扫描示例
    /*
    wx.openBluetoothAdapter({
      success: (res) => {
        console.log('初始化蓝牙适配器成功');
        this.startBluetoothDevicesDiscovery();
      },
      fail: (err) => {
        console.error('初始化蓝牙适配器失败', err);
        this.setData({ scanning: false });
        
        wx.showModal({
          title: '蓝牙初始化失败',
          content: '请确保设备蓝牙已开启',
          showCancel: false
        });
      }
    });
    */
  },

  startBluetoothDevicesDiscovery: function() {
    wx.startBluetoothDevicesDiscovery({
      services: ['FFF0'], // 根据实际设备服务UUID调整
      success: (res) => {
        console.log('开始搜索蓝牙设备');
        this.onBluetoothDeviceFound();
      },
      fail: (err) => {
        console.error('搜索蓝牙设备失败', err);
        this.setData({ scanning: false });
      }
    });
  },

  onBluetoothDeviceFound: function() {
    wx.onBluetoothDeviceFound((res) => {
      const devices = res.devices;
      console.log('发现新设备', devices);
      
      // 过滤并添加到设备列表
      const newDevices = devices.filter(device => {
        // 根据设备名称或特征过滤目标设备
        return device.name && device.name.includes('BeautyCap');
      });
      
      if (newDevices.length > 0) {
        this.setData({
          devices: [...this.data.devices, ...newDevices]
        });
      }
    });
  },

  stopScan: function() {
    if (!this.data.scanning) return;
    
    this.setData({ scanning: false });
    
    // 实际停止蓝牙扫描
    /*
    wx.stopBluetoothDevicesDiscovery({
      success: (res) => {
        console.log('停止搜索蓝牙设备');
      }
    });
    */
  },

  connectDevice: function(e) {
    const deviceId = e.currentTarget.dataset.id;
    const device = this.data.devices.find(d => d.deviceId === deviceId);
    
    if (!device) return;
    
    this.setData({
      showConnectModal: true,
      connectingDeviceId: deviceId,
      errorMessage: ''
    });
    
    // 模拟连接设备
    setTimeout(() => {
      // 随机模拟连接成功或失败
      const success = Math.random() > 0.3;
      
      if (success) {
        // 连接成功
        device.batteryLevel = Math.floor(Math.random() * 100);
        device.storageInfo = {
          total: 32000,  // MB
          used: Math.floor(Math.random() * 32000),
          free: 0  // 将在下面计算
        };
        device.storageInfo.free = device.storageInfo.total - device.storageInfo.used;
        
        // 保存到全局数据
        const app = getApp();
        if (app.globalData) {
          app.globalData.connectedDevice = device;
        }
        
        this.setData({
          connected: true,
          currentDevice: device,
          batteryLevel: device.batteryLevel,
          storageInfo: device.storageInfo,
          showConnectModal: false
        });
        
        wx.showToast({
          title: '连接成功',
          icon: 'success',
          duration: 1500
        });
      } else {
        // 连接失败
        this.setData({
          showConnectModal: true,
          errorMessage: '连接失败，请重试'
        });
      }
    }, 2000);
    
    // 实际蓝牙连接示例
    /*
    wx.createBLEConnection({
      deviceId: deviceId,
      success: (res) => {
        console.log('连接设备成功', res);
        
        // 获取设备服务
        this.getBLEDeviceServices(deviceId);
        
        // 保存到全局数据
        const app = getApp();
        if (app.globalData) {
          app.globalData.connectedDevice = device;
        }
        
        this.setData({
          connected: true,
          currentDevice: device,
          showConnectModal: false
        });
        
        // 获取设备状态
        this.getDeviceStatus(deviceId);
      },
      fail: (err) => {
        console.error('连接设备失败', err);
        this.setData({
          showConnectModal: true,
          errorMessage: '连接失败：' + err.errMsg
        });
      }
    });
    */
  },

  disconnectDevice: function() {
    wx.showModal({
      title: '断开连接',
      content: '确定要断开与当前设备的连接吗？',
      success: (res) => {
        if (res.confirm) {
          // 模拟断开连接
          const app = getApp();
          if (app.globalData) {
            app.globalData.connectedDevice = null;
          }
          
          this.setData({
            connected: false,
            currentDevice: null,
            batteryLevel: null,
            storageInfo: {
              total: 0,
              used: 0,
              free: 0
            }
          });
          
          wx.showToast({
            title: '已断开连接',
            icon: 'success',
            duration: 1500
          });
          
          // 实际蓝牙断开连接
          /*
          wx.closeBLEConnection({
            deviceId: this.data.currentDevice.deviceId,
            success: (res) => {
              console.log('断开设备连接成功');
              
              const app = getApp();
              if (app.globalData) {
                app.globalData.connectedDevice = null;
              }
              
              this.setData({
                connected: false,
                currentDevice: null,
                batteryLevel: null,
                storageInfo: {
                  total: 0,
                  used: 0,
                  free: 0
                }
              });
            },
            fail: (err) => {
              console.error('断开设备连接失败', err);
            }
          });
          */
        }
      }
    });
  },

  updateDeviceStatus: function() {
    // 模拟更新设备状态
    const batteryLevel = Math.floor(Math.random() * 100);
    const used = Math.floor(Math.random() * 32000);
    const total = 32000;
    const free = total - used;
    
    this.setData({
      batteryLevel: batteryLevel,
      storageInfo: {
        total: total,
        used: used,
        free: free
      }
    });
    
    // 更新全局数据
    const app = getApp();
    if (app.globalData && app.globalData.connectedDevice) {
      app.globalData.connectedDevice.batteryLevel = batteryLevel;
      app.globalData.connectedDevice.storageInfo = {
        total: total,
        used: used,
        free: free
      };
    }
  },

  formatStorage: function(size) {
    if (size < 1024) {
      return size + ' MB';
    } else {
      return (size / 1024).toFixed(1) + ' GB';
    }
  },

  closeConnectModal: function() {
    this.setData({
      showConnectModal: false
    });
  },

  retryConnect: function() {
    const deviceId = this.data.connectingDeviceId;
    this.setData({
      showConnectModal: true,
      errorMessage: ''
    });
    
    // 重新调用连接方法
    const e = { currentTarget: { dataset: { id: deviceId } } };
    this.connectDevice(e);
  },

  getMockDevices: function() {
    // 生成模拟设备数据
    return [
      {
        deviceId: 'device-001',
        name: 'BeautyCap-001',
        RSSI: -75,
        deviceType: 'BeautyCap Pro'
      },
      {
        deviceId: 'device-002',
        name: 'BeautyCap-002',
        RSSI: -60,
        deviceType: 'BeautyCap Lite'
      },
      {
        deviceId: 'device-003',
        name: 'BeautyCap-003',
        RSSI: -85,
        deviceType: 'BeautyCap Pro'
      }
    ];
  }
})