'use strict';

function start() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    console.log('不支持');
  } else {
    let deviceId = videoSource.value;
    let constrants = {
      video: {
        width: 320,
        height: 240,
        // facingMode: 'environment',
        deviceId: deviceId ? deviceId : undefined
        // frameRate: 15
      },
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

let videoplay = document.querySelector('video#player');

function gotMediaStream(stream) {
  videoplay.srcObject = stream;

  return navigator.mediaDevices.enumerateDevices();  // 返回一个 promise
}

let audioSource = document.querySelector('select#audioSource');
let audioOutput = document.querySelector('select#audioOutput');
let videoSource = document.querySelector('select#videoSource');

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

// 触发事件
videoSource.onchange = function () {
  start();
  alert('切换摄像头!')
};
