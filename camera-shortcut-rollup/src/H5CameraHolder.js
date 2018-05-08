import CameraHolder from './CameraHolder';
import { downloadCanvas, uploadCanvas } from './CanvasUtil';

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
          console.log('getUserMedia get stream:', stream);
          this.videoInput.srcObject = stream;
          this.videoInput.play()
            .then(() => {
              resolve('init over!');
            });
        }, (error) => {
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

export default H5CameraHolder;
