// import ms from 'ms';
// import lunchtime from './lunchtime.js';
// import millisecondsUntil from './millisecondsUntil.js';

// export default function howLongUntilLunch(hours, minutes) {
// 	// lunch is at 12.30
// 	if (hours === undefined) hours = 12;
// 	if (minutes === undefined) minutes = 30;
//
// 	var millisecondsUntilLunchTime = millisecondsUntil(lunchtime(hours, minutes));
// 	return ms(millisecondsUntilLunchTime, { long: true });
// }
const navi = navigator;
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
    if (('wx' in window) && typeof wx !== 'undefined' && wx.createCameraContext) {
      this.isWx = true;
      this.ctx = null;
    } else {
      this.isWx = false;
      this.videoInput = null;
      this.canvasInput = null;
    }
    this.photoQuality = 92;
    console.log("isWx=", this.isWx);
  }

  init(videoInput, canvasInput = null) {
    if (this.isWx) {
      this.ctx = wx.createCameraContext();
      return Promise.resolve();
    }
    this.videoInput = videoInput;
    if (canvasInput) this.canvasInput = canvasInput;
    this.canvasInput = this.canvasInput || document.createElement('canvas');

    return new Promise((reslove, reject) => {
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

  // 接受0~100数字或者low、normal、high的字符串
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

  takePhoto() {
    if (this.isWx) {
      return new Promise((resolve) => {
        const quality = QualityChange.itos(this.photoQuality);
        console.log('this.photoQuality=', this.photoQuality, ' quality=', quality);
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
    const {videoInput: video, canvasInput: canvas} = this;
    console.log(video, canvas);
    const ctx = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return Promise.resolve();
    //
    // const {quality} = this.state;
    // const type = 'image/jpeg';
    //
    // console.log('quality type=', typeof quality, quality, canvas.width, canvas.height);
    // canvas.toBlob((blob) => {
    //   console.log('toBlob', blob, quality);
    //   this.setState({
    //     ...this.state,
    //     imageUrl: URL.createObjectURL(blob),
    //     imageObj: blob,
    //   });
    // }, type, parseFloat(quality));
  }
}

export default CameraHolder;
