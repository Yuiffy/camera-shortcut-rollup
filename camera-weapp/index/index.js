const CameraHolderFactory = require('../lib/camera-holder.cjs.js');
Page({
  onLoad() {
    // this.ctx = wx.createCameraContext()
    this.ch = CameraHolderFactory.createCameraHolder();
    this.ch.init().then(() => { console.log('init over') });
  },
  takePhoto() {
    this.ch.setPhotoQuality('low').takePhoto().then(
      (res) => {
        this.setData({
          src: res.tempImagePath
        });
        wx.getImageInfo({
          src: res.tempImagePath,
          success: (res) => console.log(res)
        })
        wx.saveImageToPhotosAlbum({
          filePath: res.tempImagePath
        });
      });
  },
  startRecord() {
    this.ch.ctx.startRecord({
      success: (res) => {
        console.log('startRecord')
      }
    })
  },
  stopRecord() {
    this.ch.ctx.stopRecord({
      success: (res) => {
        this.setData({
          src: res.tempThumbPath,
          videoSrc: res.tempVideoPath
        })
      }
    })
  },
  error(e) {
    console.log(e.detail)
  }
})