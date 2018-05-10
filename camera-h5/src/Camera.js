import React from 'react';
import {CameraHolderFactory, CanvasUtil} from './lib/camera-holder.esm.js'
import headtrackr from './lib/headtracker.js'
import clm from 'clmtrackr';
import './Camera.css';
import PopButton from "./components/PopButton";

const navi = navigator;
const win = window;
// // 做一些兼容处理以兼容更多浏览器。但现在用navigator.mediaDevices.getUserMedia了，不用navi.getUserMedia。
// navi.getUserMedia = navi.getUserMedia
//   || navi.webkitGetUserMedia
//   || navi.mozGetUserMedia;
const URL = win.URL || win.webkitURL; // 获取到window.URL对象

function toFullScreen(dom = document.documentElement) {
  if (dom.requestFullscreen) {
    return dom.requestFullScreen();
  } else if (dom.webkitRequestFullScreen) {
    return dom.webkitRequestFullScreen();
  } else if (dom.mozRequestFullScreen) {
    return dom.mozRequestFullScreen();
  } else {
    return dom.msRequestFullscreen();
  }
}


class Camera extends React.Component {
  video;
  canvas;
  overlayCanvas;
  photoCanvas;
  cameraHolder;
  ctracker;

  constructor(props, context) {
    super(props, context);
    this.state = {
      cameras: [],
      audios: [],
      cameraSelect: null,
      audioSelect: null,
      debug: false,
      headState: "none"
    };
    this.cameraHolder = CameraHolderFactory.createCameraHolder();
    //init在willMount中启动
    // this.cameraHolder.setAspectRatio(4.0 / 3).init(this.video, this.canvas).then((result) => {
    //
    // });
    this.drawCanvas = this.drawCanvas.bind(this);
    this.gotDevices = this.gotDevices.bind(this);
    this.sendImage = this.sendImage.bind(this);
    this.saveFile = this.saveFile.bind(this);
  }


  componentWillMount() {
    // 获取设备列表存到state
    navi.mediaDevices.enumerateDevices()
      .then(this.gotDevices);
  }

  componentDidMount() {
    var videoInput = this.video;
    var canvasInput = this.canvas;

    const that = this;

    this.getStream(this.state.cameraSelect, this.state.audioSelect).then((result) => {
      that.video.width = that.video.videoWidth || that.video.width || 320;
      that.video.height = that.video.videoHeight || that.video.height || 240;
      that.canvas.width = that.video.width;
      that.canvas.height = that.video.height;
      that.overlayCanvas.width = that.canvas.width;
      that.overlayCanvas.height = that.canvas.height;

      console.log("cameraHolder init over, result:", result);
      var canvasInput = this.overlayCanvas;
      var cc = canvasInput.getContext('2d');
      const videoInput = this.video;

      const ctracker = new clm.tracker();
      ctracker.init();
      ctracker.start(videoInput);
      this.ctracker = ctracker;

      const requestAnimFrame = (function() {
        return window.requestAnimationFrame ||
          window.webkitRequestAnimationFrame ||
          window.mozRequestAnimationFrame ||
          window.oRequestAnimationFrame ||
          window.msRequestAnimationFrame ||
          function(/* function FrameRequestCallback */ callback, /* DOMElement Element */ element) {
            return window.setTimeout(callback, 1000 / 60);
          };
      })();

      let preTime = 0;

      function positionLoop() {
        requestAnimFrame(positionLoop);
        var positions = ctracker.getCurrentPosition();
        // do something with the positions ...
        // print the positions
        var positionString = "";
        if (positions) {
          cc.clearRect(0, 0, canvasInput.width, canvasInput.height);
          ctracker.draw(canvasInput);

          const score = ctracker.getScore();
          // console.log("score:", score);
          const nowTime = new Date().getTime();
          if (nowTime - preTime > 5 * 1000) {
            if (score > 0.5) {
              preTime = nowTime;
              if (that.state.headState !== "found") {//已经found了就只更新时间不更新其他，没found就改为found并截头像
                that.setState({...that.state, headState: "found"});
                let minx = positions[0][0], miny = positions[0][1];
                let maxx = minx, maxy = miny;
                positions.forEach((position) => {
                  const x = position[0];
                  const y = position[1];
                  minx = Math.min(minx, x);
                  maxx = Math.max(maxx, x);
                  miny = Math.min(miny, y);
                  maxy = Math.max(maxy, y);
                });
                // 照相full_photo，然后上传full_photo
                that.cameraHolder.takePhoto().then(() => {
                  CanvasUtil.uploadCanvas(that.photoCanvas, '/ocr/uploadImage', 'image/jpeg', 'full_photo.jpeg');
                });
                const {tempCanvas, headCanvas, canvas} = that;
                const angle = Math.PI / 2;
                const width = maxx - minx;
                const height = maxy - miny;
                const sx = minx + width / 2;//不知道为什么这个positions比实际的点偏移了半个头，要偏移回来
                const sy = miny + height / 2;
                console.log("head:", minx, miny, maxx, maxy, width, height);
                // CanvasUtil.drawRect(that.overlayCanvas, sx, sy, angle, width, height, 3, "#00CC00");
                CanvasUtil.cropRectToCanvas(videoInput, headCanvas, tempCanvas, sx, sy, angle, width, height, 1 / 1);
                CanvasUtil.clipCircle(headCanvas);
                CanvasUtil.uploadCanvas(that.headCanvas, '/ocr/uploadImage', 'image/jpeg', 'head_photo.jpeg');
              }
            } else {
              //分数少于0.5时
              if (that.state.headState !== "detecting")
                that.setState({
                  ...that.state,
                  headState: "detecting"
                });
            }
          } else {
            //距离上次检测到不到5秒，不进行处理
          }
        }
      }

      positionLoop();
    });

    const overlayCanvas = this.overlayCanvas;
  }

  componentDidUpdate() {
  }

  // 获取视频流在video中播放
  getStream(camera, audio) {
    return this.cameraHolder.setAspectRatio(4 / 3).init(this.video, this.photoCanvas);
  }

  // 将设备分为视频设备和音频设备存储到state
  gotDevices(deviceInfos) {
    const audios = [];
    // const cameras = [];
    // for (let i = 0; i !== deviceInfos.length; i += 1) {
    //   const deviceInfo = deviceInfos[i];
    //   const option = {
    //     value: deviceInfo.deviceId,
    //     text: '',
    //   };
    //   if (deviceInfo.kind === 'audioinput') {
    //     option.text = deviceInfo.label ||
    //       `microphone ${audios.length + 1}`;
    //     audios.push(option);
    //   } else if (deviceInfo.kind === 'videoinput') {
    //     option.text = deviceInfo.label || `camera ${
    //     cameras.length + 1}`;
    //     cameras.push(option);
    //     // console.log('camera source/device: ', deviceInfo);
    //   } else {
    //     console.log('Found one other kind of source/device: ', deviceInfo);
    //   }
    // }
    const {cameraHolder} = this;
    cameraHolder.refreshDeviceList().then((cameras) => {
      const newState = {
        ...this.state,
        audios,
        cameras,
      };
      newState.cameraSelect = cameraHolder.select;
      // if (audios.length > 0) newState.audioSelect = audios[0].value;
      this.setState(newState);
    });

  }

  // 将video画到canvas里
  drawCanvas() {
    this.cameraHolder.takePhoto().then(() => {
    });
  }

  cameraChange(e) {
    const {value} = e.target;
    this.cameraHolder.selectDevice(value);
  }

  audioChange(e) {
    const {value} = e.target;
    this.setState({...this.state, audioSelect: value});
  }

  sendImage() {
    // const name = `${this.state.quality}.jpg`;
    // if (this.props.onSendImage) {
    //   this.props.onSendImage(this.state.imageObj, name);
    // }
    this.cameraHolder.uploadFile('/ocr/uploadImage', 'image/jpeg', `photo_${this.state.quality}.jpeg`);
  }

  saveFile() {
    this.cameraHolder.saveFile('photo', 'jpeg');
  }

  render() {
    const {
      audios, cameras, headState
    } = this.state;
    // console.log('render', cameras);
    return (
      <div>
        <div className='full-window'>
          {/*主视频界面*/}
          <div className='video-field'>
            <div style={{position: "relative"}}>
              <video
                ref={(video) => {
                  this.video = video;
                }}
                muted
                autoPlay
                playsInline
                controls
                loop
                preload='auto'
                width="640"
                height="480"
                className='main-video'
              />
            </div>
            <div className='overlay'>
              <canvas ref={(canvas) => {
                this.overlayCanvas = canvas;
              }} className='main-video'/>
            </div>

            <PopButton className='overlay'>
              <div className='setting-menu'>
                <div>
                  <div>
                    <span>摄像头：</span>
                    <select onChange={this.cameraChange.bind(this)}>
                      {
                        cameras.map(option =>
                          <option key={option.value} value={option.value}>{option.text}</option>)
                      }
                    </select>
                    {/*麦克风：*/}
                    {/*<select onChange={this.audioChange.bind(this)}>*/}
                    {/*{*/}
                    {/*audios.map(option =>*/}
                    {/*<option key={option.value} value={option.value}>{option.text}</option>)*/}
                    {/*}*/}
                    {/*</select>*/}
                    <br/>
                    <span>截图保存质量：</span><input
                    defaultValue={0.92}
                    style={{'width': '5vw'}}
                    onChange={(e) => {
                      this.cameraHolder.setPhotoQuality(parseFloat(e.target.value));
                    }}
                  />
                  </div>
                  <div>
                    <input type="button" onClick={this.drawCanvas} value="截图"/>
                    <input type="button" onClick={this.saveFile} value="保存截图到本地"/>
                    <input type="button" onClick={this.sendImage} value="上传截图"/>
                    <input type="button" onClick={() => {
                      this.ctracker.stop();
                      this.ctracker.start(this.video);
                    }} value="重新跟踪"/>
                    <input type="button" onClick={() => {
                      this.ctracker.stop();
                    }} value="关闭跟踪"/>
                    <input type="button" onClick={() => {
                      toFullScreen();
                    }} value="页面全屏"/>
                    <input type="button" onClick={() => {
                      this.setState({...this.state, debug: this.state.debug ^ 1});
                    }} value="debug"/>
                    <br/>
                    {/*{this.state.imageObj ? `size: ${(this.state.imageObj.size / 1024).toFixed(2)}KB` : null}*/}
                    {/*{this.state.imageObj && this.video ? ` 实际宽：${this.video.videoWidth} 高：${this.video.videoHeight}` : null}*/}
                  </div>
                </div>
              </div>
            </PopButton>
          </div>
          <div className='bottom-field'>
            <div className='head-field'>
              <canvas ref={(canvas) => {
                this.headCanvas = canvas;
              }} className={`head-canvas ${headState}`}/>
            </div>
            {headState !== 'none' ? <div className='hint-field'>
              <div className='hint'>
                {headState === 'detecting' ? '正在识别...' : null}
                {headState === 'found' ? '欢迎！' : null}
              </div>
            </div> : null}
            <br/>
          </div>
        </div>
        <div style={{display: this.state.debug ? 'inherit' : 'none'}}>
          <canvas className='photo-canvas' ref={(canvas) => {
            this.photoCanvas = canvas;
          }}/>
          <canvas ref={(canvas) => {
            this.canvas = canvas;
          }} className='main-video'/>
          <canvas ref={(canvas) => {
            this.tempCanvas = canvas;
          }}/>
        </div>
      </div>
    );
  }
}

export default Camera;
