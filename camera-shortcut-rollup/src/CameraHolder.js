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

export default CameraHolder;
