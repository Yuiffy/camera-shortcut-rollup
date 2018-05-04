import CameraHolder from './CameraHolder';

let wxApi = null;
try {
  if (typeof wx !== 'undefined') { // eslint-disable-line
    wxApi = wx; // eslint-disable-line
  }
} catch (e) {
}

class WxCameraHolder extends CameraHolder {
  constructor() {
    super();
    this.ctx = null;
  }

  init() {
    this.ctx = wxApi.createCameraContext();
    return Promise.resolve();
  }

  getCameraDevices() {
    return [{
      text: '前置摄像头',
      value: 'front',
    }, {
      text: '后置摄像头',
      value: 'back',
    }];
  }

  selectDevice(device) {
    return Promise.reject('wx selectDevice not impl');
  }

  takePhoto() {
    return new Promise((resolve) => {
      const quality = super.getPhotoQuality('string');
      console.log('wx takephoto, this.photoQuality=', this.photoQuality, ' quality=', quality);
      this.ctx.takePhoto({
        quality,
        success: (res) => {
          // this.setData({
          //   src: res.tempImagePath
          // });
          resolve(res);
        },
      });
    });
  }
}

export default WxCameraHolder;
