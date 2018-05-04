import CameraHolder from './CameraHolder';

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

export default H5CameraHolder;
