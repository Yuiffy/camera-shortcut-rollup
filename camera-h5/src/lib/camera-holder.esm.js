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
    this.aspectRatio = 4 / 3;
    this.cameraDevices = [];
    this.select = null;
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

  setAspectRatio(aspectRatio) {
    if (aspectRatio > 0) {
      console.log('aspectRatio =', aspectRatio);
      this.aspectRatio = aspectRatio;
    } else {
      console.log('aspectRatio <= 0 ! wont save.');
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
    return this.cameraDevices;
  }

  selectDevice(deviceValue) {
    return new Promise((resolve, reject) => {
      const selectList = this.cameraDevices.filter(device => device.value === deviceValue);
      if (selectList.length === 0) reject(new Error('找不到所选设备！请刷新网页试试'));
      this.select = deviceValue;
      this.refreshStream()
        .then(
          result => resolve(result),
          result => reject(result),
        );
    });
  }

  takePhoto() {
    return Promise.reject('takePhoto not impl');
  }

  uploadFile(url) {
    return Promise.reject('uploadFile not impl');
  }

  saveFile(fileNamePrefix, type) {
    return Promise.reject('saveFile not impl');
  }

  refreshStream() {
    return Promise.reject('refreshStream not impl');
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
    this.cameraDevices = [{
      text: '前置摄像头',
      value: 'front',
    }, {
      text: '后置摄像头',
      value: 'back',
    }];
    this.select = 'front';
  }

  init() {
    this.ctx = wxApi.createCameraContext();
    return Promise.resolve();
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

const downloadCanvas = (canvas, fileNamePrefix, type, photoQuality) => {
  canvas.toBlob((blob) => {
    console.log('toBlob', blob, photoQuality);

    const a = document.createElement('a');
    const url = window.URL.createObjectURL(blob);
    const filename = `${fileNamePrefix}.${type}`;
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  }, `image/${type}`, photoQuality);
};

const uploadCanvas = (canvas, apiUrl, type = 'image/jpeg', name = 'file.jpeg', quality = 0.92) => new Promise((resolve, reject) => {
  canvas.toBlob((blob) => {
    console.log('uploadCanvas toBlob over', blob, quality);
    const form = new FormData();
    form.append('image', blob, name);
    fetch(apiUrl, {
      method: 'POST',
      credentials: 'same-origin',
      body: form,
      // headers: {
      // },
    })
      .then((response) => {
        resolve(response);
      })
      .catch((e) => {
        reject(e);
      });
  }, type, quality);
});

const clipCircle = (canvas, _x = null, _y = null, _r = null) => {
  if (canvas.width <= 0 || canvas.height <= 0) return;
  const x = _x || canvas.width / 2;
  const y = _y || canvas.height / 2;
  const minW = Math.min(x, y);
  let r = _r || minW;
  if (r <= 0) r = 100;
  const ctx = canvas.getContext('2d');

  const tempCanvas = document.createElement('canvas');
  const tempCtx = tempCanvas.getContext('2d');
  tempCanvas.width = 2 * r;
  tempCanvas.height = 2 * r;
  // TODO: 有时候会报错index out什么的
  tempCtx.drawImage(canvas, x - r, y - r, 2 * r, 2 * r, 0, 0, 2 * r, 2 * r);// 保存方形图像到临时canvas中

  ctx.save(); // 保存当前ctx的状态
  // ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.arc(x, y, r, 0, 2 * Math.PI); // 画出圆 x,y,r,0,2pi
  ctx.clip(); // 裁剪上面的圆形
  ctx.drawImage(tempCanvas, 0, 0, 2 * r, 2 * r, x - r, y - r, 2 * r, 2 * r); // 在刚刚裁剪的圆上画图
  // ctx.fillRect(0, 0, 100, 100);
  ctx.restore(); // 还原状态
};

const drawRect = (canvas, x, y, angle, width, height, lineWidth = 1, color = '#00CC00') => {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.translate(x, y);
  ctx.rotate(angle - (Math.PI / 2));
  ctx.lineWidth = lineWidth;
  ctx.strokeStyle = color;
  ctx.strokeRect((-(width / 2)), (-(height / 2)), width, height);
  ctx.rotate((Math.PI / 2) - angle);
  ctx.translate(-x, -y);
};

const fitMinMax = (value, min, max) => {
  let ret = value;
  ret = Math.min(ret, max);
  ret = Math.max(ret, min);
  return ret;
};

function cropRectToCanvas(
  canvas, headCanvas, tempCanvas = null,
  x, y, angle, width, height, aspectRatio = null,
) {
  if (!tempCanvas) tempCanvas = document.createElement('canvas');
  tempCanvas.width = canvas.width;
  tempCanvas.height = canvas.height;
  const ctx2 = tempCanvas.getContext('2d');
  ctx2.translate(x, y);
  ctx2.rotate((Math.PI / 2) - angle);
  ctx2.translate(-x, -y);
  ctx2.drawImage(canvas, 0, 0);
  ctx2.translate(x, y);
  ctx2.rotate(angle - (Math.PI / 2));
  ctx2.translate(-x, -y);
  // that.photoCanvas.getContext('2d').drawImage(that.canvas, x - width / 2, y - height / 2, width, height, 0, 0, width, height);//裁剪

  // Safari不接受0的长宽
  width = fitMinMax(width, 1, tempCanvas.width - 1);
  height = fitMinMax(height, 1, tempCanvas.height - 1);

  if (aspectRatio !== null && aspectRatio != 0) {
    // 截取更多的部分来满足长宽比
    if (height * aspectRatio > width) {
      width = height * aspectRatio;
    } else {
      height = width / aspectRatio;
    }
  }
  headCanvas.width = width;
  headCanvas.height = height;

  let sx = x - width / 2;
  let sy = y - height / 2;
  // safari不允许框超出原图像，否则会不绘图。
  sx = fitMinMax(sx, 0, tempCanvas.width - width - 1);
  sy = fitMinMax(sy, 0, tempCanvas.height - height - 1);

  headCanvas.getContext('2d')
    .drawImage(tempCanvas, sx, sy, width, height, 0, 0, width, height);// 裁剪
}

var CanvasUtil = /*#__PURE__*/Object.freeze({
  downloadCanvas: downloadCanvas,
  uploadCanvas: uploadCanvas,
  drawRect: drawRect,
  cropRectToCanvas: cropRectToCanvas,
  clipCircle: clipCircle
});

const navi = navigator;

class H5CameraHolder extends CameraHolder {
  constructor() {
    super();
    this.videoInput = null;
    this.canvasInput = null;
  }

  // 将设备分为视频设备和音频设备存储到state
  refreshDeviceList() {
    return new Promise((resolve, reject) => {
      navi.mediaDevices.enumerateDevices()
        .then((deviceInfos) => {
          const audios = [];
          const cameras = [];
          for (let i = 0; i !== deviceInfos.length; i += 1) {
            const deviceInfo = deviceInfos[i];
            const option = {
              value: deviceInfo.deviceId,
              text: '',
            };
            if (deviceInfo.kind === 'audioinput') {
              option.text = deviceInfo.label ||
                `microphone ${audios.length + 1}`;
              audios.push(option);
            } else if (deviceInfo.kind === 'videoinput') {
              option.text = deviceInfo.label || `camera ${cameras.length + 1}`;
              cameras.push(option);
            } else {
              console.log('Found one other kind of source/device: ', deviceInfo);
            }
          }
          this.cameraDevices = cameras;
          if (cameras.length > 0) this.select = cameras[0].value;
          resolve('refresh Device List success');
        })
        .catch((e) => {
          reject(e);
        });
    });
  }

  init(videoInput = null, canvasInput = null) {
    return new Promise((resolve, reject) =>
      this.refreshDeviceList()
        .then((result) => {
          console.log('refreshDeviceList then result=', result);
          if (videoInput) this.videoInput = videoInput;
          if (canvasInput) this.canvasInput = canvasInput;
          this.canvasInput = this.canvasInput || document.createElement('canvas');
          this.videoInput = this.videoInput || document.createElement('video');
          this.refreshStream()
            .then(result2 => resolve(result2), result3 => reject(result3));
        }));
  }

  refreshStream() {
    return new Promise((resolve, reject) => {
      const constraints = {
        video: {
          // width: {
          //   // min: 480,
          //   // ideal: 4320,
          // },
          height: {
            min: 480,
            ideal: 4320,
          },
          // advanced: [],
        },
      };
      // 选择设备
      if (this.select) constraints.video.deviceId = { exact: this.select };
      if (this.aspectRatio) constraints.video.aspectRatio = { ideal: this.aspectRatio };
      const supported = navi.mediaDevices.getSupportedConstraints();
      console.log('constraints = ', constraints, ' supported=', supported);
      navi.mediaDevices.getUserMedia(constraints)
        .then((stream) => {
          console.log('getUserMedia get stream, ready to play():', stream);
          this.videoInput.srcObject = stream;

          this.videoInput.play()
            .then(() => {
              console.log('play() over!');
              resolve('play() over!');
            })
            .catch((e) => {
              console.log('videoInput.play() Error: ', e);
              reject(e);
            });
        })
        .catch((error) => {
          // alert(`Error! ${JSON.stringify(error)}`);
          console.log('getUserMedia Error: ', error);
          reject(error);
        });
    });
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

  // 这个type要传入"image/jpeg"这样的形式
  uploadFile(apiUrl, type, name) {
    return uploadCanvas(this.canvasInput, apiUrl, type, name, this.photoQuality);
  }

  // 传入"png"或者"jpeg",会用在文件后缀名和toBlob用的"image/xxx"里
  saveFile(fileNamePrefix, type) {
    const canvas = this.canvasInput;
    const { photoQuality } = this;
    downloadCanvas(canvas, fileNamePrefix, type, photoQuality);
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

export { CameraHolderFactory, CanvasUtil };
