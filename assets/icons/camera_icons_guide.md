# 相机和AI助手图标指南

为了使相机和AI助手功能正常工作，请添加以下图标文件到 `assets/icons` 目录：

## 相机控制图标
- `switch-camera.png` - 切换前后摄像头的图标
- `flash-auto.png` - 闪光灯自动模式图标
- `flash-on.png` - 闪光灯开启模式图标
- `flash-off.png` - 闪光灯关闭模式图标

## AI助手图标
- `ai-assistant.png` - AI助手头像图标
- `angle-icon.png` - 角度提示图标
- `light-icon.png` - 光线提示图标
- `position-icon.png` - 位置提示图标
- `composition-icon.png` - 构图提示图标

## 图标建议
- 建议使用白色或浅色图标，因为它们将显示在深色背景上
- 建议图标尺寸为 60px × 60px 或更大，以确保清晰度
- 可以使用PNG格式，支持透明背景

## 临时解决方案
在您添加实际图标之前，可以修改代码以使用文本或其他已有图标作为临时替代。例如，可以修改 `index.js` 中的 `flashImages` 对象，使用已有的图标：

```javascript
flashImages: {
  'auto': '/assets/icons/home.png',
  'on': '/assets/icons/style.png',
  'off': '/assets/icons/settings.png'
}
```

同样，可以修改 `index.wxml` 中的图标引用，使用已有图标或简单的文本替代。