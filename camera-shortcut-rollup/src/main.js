import WxCameraHolder from './WxCameraHolder';
import H5CameraHolder from './H5CameraHolder';
import * as CanvasUtil from './CanvasUtil';

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
