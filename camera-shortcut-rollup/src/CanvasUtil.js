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
  const x = _x || canvas.width / 2;
  const y = _y || canvas.height / 2;
  const minW = Math.min(x, y);
  const r = _r || minW;
  const ctx = canvas.getContext('2d');

  const tempCanvas = document.createElement('canvas');
  const tempCtx = tempCanvas.getContext('2d');
  tempCanvas.width = 2 * r;
  tempCanvas.height = 2 * r;
  tempCtx.drawImage(canvas, x - r, y - r, 2 * r, 2 * r); // 在刚刚裁剪的园上画图

  ctx.save(); // 保存当前ctx的状态
  // ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.arc(x, y, r, 0, 2 * Math.PI); // 画出圆 x,y,r,0,2pi
  ctx.clip(); // 裁剪上面的圆形
  ctx.drawImage(tempCanvas, 0, 0, tempCanvas.width, tempCanvas.height); // 在刚刚裁剪的园上画图
  // ctx.fillRect(0, 0, 100, 100);
  ctx.restore(); // 还原状态
};

function drawRect(canvas, x, y, angle, width, height, lineWidth = 1, color = '#00CC00') {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.translate(x, y);
  ctx.rotate(angle - (Math.PI / 2));
  ctx.lineWidth = lineWidth;
  ctx.strokeStyle = color;
  ctx.strokeRect((-(width / 2)), (-(height / 2)), width, height);
  ctx.rotate((Math.PI / 2) - angle);
  ctx.translate(-x, -y);
}

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
  if (aspectRatio !== null) {
    // 截取更多的部分来满足长宽比
    if (height * aspectRatio > width) {
      width = height * aspectRatio;
    } else {
      height = width / aspectRatio;
    }
  }
  headCanvas.width = width;
  headCanvas.height = height;
  headCanvas.getContext('2d')
    .drawImage(tempCanvas, x - width / 2, y - height / 2, width, height, 0, 0, width, height);// 裁剪
}

export { downloadCanvas, uploadCanvas, drawRect, cropRectToCanvas, clipCircle };
