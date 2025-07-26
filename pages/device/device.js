// pages/device/device.js
Page({
  data: {
    devices: [],
    scanning: false,
    connected: false,
    currentDevice: null,
    showConnectModal: false,
    connectingDeviceId: '',
    errorMessage: ''
  },

  onLoad: function() {
    this.checkConnectedDevice();
  },

  onShow: function() {
    if (this.data.connected && this.data.currentDevice) {
      this.updateDeviceStatus();
    }
  },

  checkConnectedDevice: function() {
    const app = getApp();
    if (app.globalData && app.globalData.connectedDevice) {
      this.setData({
        connected: true,
        currentDevice: app.globalData.connectedDevice
      });
      this.updateDeviceStatus(); // 获取最新状态
    }
  },

  startScan: function() {
    if (this.data.scanning) return;
    
    this.setData({ scanning: true, devices: [] });
    
    // 此处为实际的设备扫描逻辑 (例如 Wi-Fi, etc.)
    // 这里我们用模拟数据代替
    console.log('开始扫描设备...');
    setTimeout(() => {
      this.setData({
        devices: this.getMockDevices(),
        scanning: false
      });
      wx.showToast({ title: '扫描完成', icon: 'success' });
    }, 2000);
  },

  stopScan: function() {
    if (!this.data.scanning) return;
    this.setData({ scanning: false });
    console.log('停止扫描设备。');
  },

  connectDevice: function(e) {
    const deviceId = e.currentTarget.dataset.id;
    const device = this.data.devices.find(d => d.deviceId === deviceId);
    if (!device) return;
    
    this.setData({ showConnectModal: true, connectingDeviceId: deviceId, errorMessage: '' });
    
    // 此处为实际的设备连接逻辑
    console.log(`尝试连接设备: ${deviceId}`);
    setTimeout(() => {
      const success = Math.random() > 0.3; // 模拟连接成功率
      if (success) {
        const app = getApp();
        if (app.globalData) {
          app.globalData.connectedDevice = device;
        }
        this.setData({ connected: true, currentDevice: device, showConnectModal: false });
        this.updateDeviceStatus();
        wx.showToast({ title: '连接成功', icon: 'success' });
      } else {
        this.setData({ showConnectModal: true, errorMessage: '连接失败，请重试' });
      }
    }, 2000);
  },

  disconnectDevice: function() {
    wx.showModal({
      title: '断开连接',
      content: '确定要断开与当前设备的连接吗？',
      success: (res) => {
        if (res.confirm) {
          console.log('断开设备连接。');
          const app = getApp();
          if (app.globalData) {
            app.globalData.connectedDevice = null;
          }
          this.setData({ connected: false, currentDevice: null });
          wx.showToast({ title: '已断开连接', icon: 'success' });
        }
      }
    });
  },

  updateDeviceStatus: function() {
    // 此处为真实的从设备获取状态的逻辑
    // 这里我们用模拟数据代替
    if (!this.data.currentDevice) return;
    const updatedDevice = {
      ...this.data.currentDevice,
      batteryLevel: Math.floor(Math.random() * 100),
      storageInfo: {
        total: 32000,
        used: Math.floor(Math.random() * 32000)
      }
    };
    updatedDevice.storageInfo.free = updatedDevice.storageInfo.total - updatedDevice.storageInfo.used;
    this.setData({ currentDevice: updatedDevice });

    const app = getApp();
    if (app.globalData) {
      app.globalData.connectedDevice = updatedDevice;
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
    this.setData({ showConnectModal: false });
  },

  retryConnect: function() {
    const deviceId = this.data.connectingDeviceId;
    this.setData({ showConnectModal: true, errorMessage: '' });
    this.connectDevice({ currentTarget: { dataset: { id: deviceId } } });
  },

  getMockDevices: function() {
    return [
      { deviceId: 'BEAUTYCAP-001', name: '客厅的摄像头', deviceType: 'BeautyCap Pro' },
      { deviceId: 'BEAUTYCAP-002', name: '书房的摄像头', deviceType: 'BeautyCap Lite' }
    ];
  }
});