'use strict';

function getDevice(deviceInfos) {
  deviceInfos.forEach(function (deviceInfo) {
    console.log("kind: " + deviceInfo.kind);
    console.log("label: " + deviceInfo.label);
    console.log("deviceId: " + deviceInfo.deviceId);
    console.log("groupId: " + deviceInfo.groupId);
  });
}

function handelErr(err) {
  alert(err);
}

if (!navigator.mediaDevices
    || !navigator.mediaDevices.enumerateDevices) {
  alert('不支持');
} else {
  // 支持
  navigator.mediaDevices.enumerateDevices()
      .then(getDevice)
      .catch(handelErr)
}
