import React from 'react';
import CameraHolder from './lib/camera-holder.esm'

const navi = navigator;
const win = window;
// // 做一些兼容处理以兼容更多浏览器。但现在用navigator.mediaDevices.getUserMedia了，不用navi.getUserMedia。
// navi.getUserMedia = navi.getUserMedia
//   || navi.webkitGetUserMedia
//   || navi.mozGetUserMedia;
const URL = win.URL || win.webkitURL; // 获取到window.URL对象

class Camera extends React.Component {
  video;
  canvas;
  cameraHolder;

  constructor(props, context) {
    super(props, context);
    this.state = {
      imageUrl: '#',
      imageObj: null,
      cameras: [],
      audios: [],
      cameraSelect: null,
      audioSelect: null,
      quality: 0.92,
    };
    this.cameraHolder = new CameraHolder();
    this.cameraHolder.init(this.video, this.canvas);
    this.drawCanvas = this.drawCanvas.bind(this);
    this.gotDevices = this.gotDevices.bind(this);
    this.sendImage = this.sendImage.bind(this);
  }


  componentWillMount() {
    // 获取设备列表存到state
    navi.mediaDevices.enumerateDevices()
      .then(this.gotDevices);
  }

  componentDidUpdate() {
    // 获取所选设备的流，在video中播放
    this.getStream(this.state.cameraSelect, this.state.audioSelect);
  }

  // 获取视频流在video中播放
  getStream(camera, audio) {
    // const constraints = {
    //   // ideal是理想值，结果的像素会尽量向他靠近；min是最小值，如果摄像头连最小值都无法满足会报错；
    //   // advanced里面可以放若干组数据，在最开始判断，选择符合条件的第一组，如果没有符合条件的才继续寻找接近ideal的。
    //   // 下面这组设置是尽量用能支持的最大的分辨率
    //   video: {
    //     width: {min: 640, ideal: 400000},
    //     height: {min: 480, ideal: 300000},
    //     advanced: [
    //       // { width: 4032, height: 3024 },
    //       // { aspectRatio: 4 / 3 },
    //     ],
    //   },
    // };
    // if (camera) constraints.video.deviceId = {exact: camera};
    // if (audio) constraints.audio = {deviceId: {exact: audio}};
    // console.log(camera, audio, constraints);
    //
    // const {video} = this;
    // const supports = navi.mediaDevices.getSupportedConstraints();
    // console.log('supports:', supports);
    // navi.mediaDevices.getUserMedia(constraints).then((stream) => {
    //   // video.src = URL.createObjectURL(stream);
    //   // 将获取到的视频流对象转换为地址。chrome提示不推荐URL.createObjectURL，safari直接报错。以后要改用srcObject
    //   console.log('getUserMedia get stream:', stream);
    //   video.srcObject = stream;
    //   video.play();
    // }, (error) => {
    //   alert(`Error! ${JSON.stringify(error)}`);
    //   console.log(error);
    // });
    const cameraHolder = new CameraHolder();
    cameraHolder.init(this.video, this.canvas);
  }

  // 将设备分为视频设备和音频设备存储到state
  gotDevices(deviceInfos) {
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
        option.text = deviceInfo.label || `camera ${
        cameras.length + 1}`;
        cameras.push(option);
        // console.log('camera source/device: ', deviceInfo);
      } else {
        console.log('Found one other kind of source/device: ', deviceInfo);
      }
    }
    const newState = {
      ...this.state,
      audios,
      cameras,
    };
    if (cameras.length > 0) newState.cameraSelect = cameras[0].value;
    if (audios.length > 0) newState.audioSelect = audios[0].value;
    this.setState(newState);
  }

  // 将video画到canvas里
  drawCanvas() {
    const {canvas, video} = this;
    console.log(video, canvas);
    const ctx = canvas.getContext('2d');
    // const { width, height } = video;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    // 获取video实际长宽
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const {quality} = this.state;
    const type = 'image/jpeg'; // 如果是image/png不能压缩，quality无效；image/jpeg能压缩

    // canvas转图片的两种方法，一种toDataURL，一种toBlob
    // const url = canvas.toDataURL('image/png', 0.5);
    // this.setState({ imageUrl: url });
    console.log('quality type=', typeof quality, quality, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      console.log('toBlob', blob, quality);
      this.setState({
        ...this.state,
        imageUrl: URL.createObjectURL(blob),
        imageObj: blob,
      });
    }, type, parseFloat(quality));
  }

  cameraChange(e) {
    const {value} = e.target;
    this.setState({...this.state, cameraSelect: value});
  }

  audioChange(e) {
    const {value} = e.target;
    this.setState({...this.state, audioSelect: value});
  }

  sendImage() {
    const name = `${this.state.quality}.jpg`;
    if (this.props.onSendImage) {
      this.props.onSendImage(this.state.imageObj, name);
    }
  }

  render() {
    const {
      audios, cameras, quality, width, height,
    } = this.state;
    // console.log('render', cameras);
    return (
      <div>
        <div style={{'text-align': 'center'}}>
          摄像头：
          <select onChange={this.cameraChange.bind(this)}>
            {
              cameras.map(option =>
                <option key={option.value} value={option.value}>{option.text}</option>)
            }
          </select>
          麦克风：
          <select onChange={this.audioChange.bind(this)}>
            {
              audios.map(option =>
                <option key={option.value} value={option.value}>{option.text}</option>)
            }
          </select>
          <br/>
          质量：<input
          defaultValue={quality}
          onChange={(e) => {
            this.setState({...this.state, quality: e.target.value});
          }}
        />
        </div>
        <div style={{'text-align': 'center'}}>
          <input type="button" onClick={this.drawCanvas} value="截图" style={{'background-color': 'white'}}/>
          <a download="snap.jpg" href={this.state.imageUrl}>保存图片到本地</a>
          <input type="button" onClick={this.sendImage} value="上传图片"/>
          <br/>
          {this.state.imageObj ? `size: ${(this.state.imageObj.size / 1024).toFixed(2)}KB` : null}
          {this.state.imageObj && this.video ? ` 实际宽：${this.video.videoWidth} 高：${this.video.videoHeight}` : null}
        </div>
        <video
          ref={(video) => {
            this.video = video;
          }}
          muted
          autoPlay
          playsInline
          controls
          width={width}
          height={height}
          style={{width: '50%', height: '100%'}}
        />
        <canvas ref={(canvas) => {
          this.canvas = canvas;
        }}/>
      </div>
    );
  }
}

export default Camera;
