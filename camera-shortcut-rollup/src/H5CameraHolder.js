import CameraHolder from './CameraHolder';

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
    return new Promise((reslove, reject) =>
      this.refreshDeviceList()
        .then((result) => {
          console.log('refreshDeviceList then result=', result);
          if (videoInput) this.videoInput = videoInput;
          if (canvasInput) this.canvasInput = canvasInput;
          this.canvasInput = this.canvasInput || document.createElement('canvas');
          this.videoInput = this.videoInput || document.createElement('video');

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
              this.videoInput.play()
                .then(() => {
                  reslove('init over!');
                });
            }, (error) => {
              // alert(`Error! ${JSON.stringify(error)}`);
              console.log('getUserMedia Error: ', error);
              reject(error);
            });
        }));
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

  uploadFile(url) {
    return Promise.reject('uploadFile not impl');
  }

  saveFile(type) {
    this.canvasInput.toBlob((blob) => {
      console.log('toBlob', blob, this.photoQuality);

      const a = document.createElement('a');
      const url = window.URL.createObjectURL(blob);
      const filename = 'photo.jpg';
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);
    }, type, this.photoQuality);
  }
}

export default H5CameraHolder;
