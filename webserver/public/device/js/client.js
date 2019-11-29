'use strict';

let audioSource = document.querySelector('select#audioSource');
let audioOutput = document.querySelector('select#audioOutput');
let videoSource = document.querySelector('select#videoSource');

if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
  alert('不支持');
} else {
  navigator.mediaDevices.enumerateDevices()
      .then(gotDevice)
      .catch(handelError);
}


function gotDevice(deviceInfos) {
  console.log(deviceInfos);
  deviceInfos.forEach(function (deviceInfo) {
    console.log("kind = " + deviceInfo.kind);
    console.log("label = " + deviceInfo.label);
    console.log("id = " + deviceInfo.deviceId);
    console.log("groupId = " + deviceInfo.groupId);
    console.log('------------------');

    let option = document.createElement('option');
    option.text = deviceInfo.deviceId;
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
  alert(err);
  //console.log(err.name + ":" err.message);
}
