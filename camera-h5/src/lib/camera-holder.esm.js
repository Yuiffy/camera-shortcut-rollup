const QualityChange = {
  qualityStringList: ['low', 'normal', 'high'],
  isQualityString: s => QualityChange.qualityStringList.indexOf(s) !== -1,
  stoi: (s) => {
    let index = QualityChange.qualityStringList.indexOf(s);
    const length = QualityChange.qualityStringList.length;
    if (index === -1) index = length - 1;
    return ((100 * (1 + index)) / length) - 0.1;
    // 0~100和'high'互相转换的规则: low: 33.23, normal: 66.56, high: 99.9
  },
  itos: (i) => {
    // 0~33为low， 33~66为normal，66~100为high
    const length = QualityChange.qualityStringList.length;
    // console.log('i=', i);
    let index = Math.floor((i / 100.0) * (length));
    // console.log('index=', index);
    if (index >= length || index < 0) index = QualityChange.qualityStringList.length - 1;
    return QualityChange.qualityStringList[index];
  },
};

class CameraHolder {
  constructor() {
    this.photoQuality = 92;
  }

  init() {
    return Promise.reject('init not impl');
  }

  // 接受0~100数字或者low、normal、high的字符串。存储为this.photoQuality，为0~100的数字。
  setPhotoQuality(quality) {
    if (typeof quality === 'string' && QualityChange.isQualityString(quality)) {
      this.photoQuality = QualityChange.stoi(quality);
    } else if (typeof quality === 'number' && quality >= 0 && quality <= 100) {
      this.photoQuality = quality;
    } else {
      throw Error(`quality must be in ${JSON.stringify(QualityChange.qualityStringList)} or 0~100 number`);
    }
    return this;
  }

  getPhotoQuality(type = 'number') {
    if (type === 'string') {
      return QualityChange.itos(this.photoQuality);
    }
    return this.photoQuality;
  }

  getCameraDevices() {
    return Promise.reject('getCameraDevices not impl');
  }

  selectDevice(device) {
    return Promise.reject('selectDevice not impl');
  }

  takePhoto() {
    return Promise.reject('takePhoto not impl');
  }
}

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

const navi = navigator;

class H5CameraHolder extends CameraHolder {
  constructor() {
    super();
    this.videoInput = null;
    this.canvasInput = null;
  }

  init(videoInput, canvasInput = null) {
    return new Promise((reslove, reject) => {
      this.videoInput = videoInput;
      if (canvasInput) this.canvasInput = canvasInput;
      this.canvasInput = this.canvasInput || document.createElement('canvas');

      const constraints = {
        video: {
          width: {
            min: 640,
            ideal: 400000,
          },
          height: {
            min: 480,
            ideal: 300000,
          },
        },
      };
      navi.mediaDevices.getUserMedia(constraints)
        .then((stream) => {
          console.log('getUserMedia get stream:', stream);
          this.videoInput.srcObject = stream;
          this.videoInput.play();
          reslove();
        }, (error) => {
          // alert(`Error! ${JSON.stringify(error)}`);
          console.log(error);
          reject(error);
        });
    });
  }

  getCameraDevices() {
    return Promise.reject('h5 getCameraDevices not impl');
  }

  selectDevice(device) {
    return Promise.reject('h5 selectDevice not impl');
  }

  takePhoto() {
    const { videoInput: video, canvasInput: canvas } = this;
    console.log('h5takePhoto', video, canvas);
    const ctx = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return Promise.resolve();
  }
}

const CameraHolderFactory = {
  createCameraHolder: () => {
    try {
      if (typeof wx !== 'undefined' && wx.request) { // eslint-disable-line
        return new WxCameraHolder();
      }
    } catch (e) {
      console.log('createCameraHolder catch:', e);
    }
    return new H5CameraHolder();
  },
};

export default CameraHolderFactory;
