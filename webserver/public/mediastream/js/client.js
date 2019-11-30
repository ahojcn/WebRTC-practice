'use strict';

let videoplay = document.querySelector('video#player');
let audioSource = document.querySelector('select#audioSource');
let audioOutput = document.querySelector('select#audioOutput');
let videoSource = document.querySelector('select#videoSource');
let filtersSelect = document.querySelector('select#filter');

// picture
let snapshot = document.querySelector('button#snapshot');
let picture = document.querySelector('canvas#picture');
picture.width = 320;
picture.height = 240;

// 获取音频
// let audioplay = document.querySelector('audio#audioplayer');


// 获取视频约束
let divConstraints = document.querySelector('div#constraints');

function start() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    console.log('不支持');
  } else {
    let deviceId = videoSource.value;
    let constrants = {
      video: {
        // width: 320,
        // height: 240,
        // facingMode: 'environment',
        deviceId: deviceId ? deviceId : undefined
        // frameRate: 15
      },
      // video: false,
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
      },
    };
    navigator.mediaDevices.getUserMedia(constrants)
        .then(gotMediaStream)
        .then(gotDevices)  // 这里是获取权限成功后执行获取设备
        .catch(handelError);
  }
}

function gotMediaStream(stream) {
  videoplay.srcObject = stream;

  let videoTrack = stream.getVideoTracks()[0];
  let videoConstraints = videoTrack.getSettings();
  divConstraints.textContent = JSON.stringify(videoConstraints, null, 2);  // 最后一个 2 表示缩进的空格

  // audioplay.srcObject = stream;

  return navigator.mediaDevices.enumerateDevices();  // 返回一个 promise
}


function gotDevices(deviceInfos) {
  deviceInfos.forEach(function (deviceInfo) {

    let option = document.createElement('option');
    option.text = deviceInfo.label;
    option.value = deviceInfo.deviceId;

    if (deviceInfo.kind === 'audioinput') {
      audioSource.appendChild(option);
    } else if (deviceInfo.kind === 'audiooutput') {
      audioOutput.appendChild(option);
    } else if (deviceInfo.kind === 'videoinput') {
      videoSource.appendChild(option);
    }

  });
}

function handelError(err) {
  console.log(err)
}


start();

// 切换 videoSource 设备触发事件
videoSource.onchange = function () {
  start();
  alert('切换摄像头!')
};

// filtersSelect 切换触发事件
filtersSelect.onchange = function () {
  videoplay.className = filtersSelect.value;
};


// 截图点击事件
snapshot.onclick = function () {
  picture.className = filtersSelect.value;  // 注意只在浏览器中有滤镜效果、下载下来后不会有滤镜效果
  picture.getContext('2d').drawImage(
      videoplay,
      0, 0,  // 起始点
      picture.width, picture.height  // 宽高
  );
};
