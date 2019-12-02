'use strict';

var localVideo = document.querySelector('video#localvideo');
var remoteVideo = document.querySelector('video#remotevideo');

var btnStart = document.querySelector('button#start');
var btnCall = document.querySelector('button#call');
var btnHangup = document.querySelector('button#hangup');

var localStream;
var pc1;
var pc2;


btnStart.onclick = start;
btnCall.onclick = call;
btnHangup.onclick = hangup;


function start() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    alert('当前浏览器不支持!');
    return;
  }

  var constraints = {
    video: true,
    audio: false
  };
  navigator.mediaDevices.getUserMedia(constraints)
      .then(getMediaStream)
      .catch(handleError)
}


function call() {
  pc1 = new RTCPeerConnection();  /* 本机内传输，不设置参数，使用本机默认参数 */
  pc2 = new RTCPeerConnection();

  pc1.onicecandidate = (e) => {
    pc2.addIceCandidate(e.candidate);
  };

  pc2.onicecandidate = (e) => {
    pc1.addIceCandidate(e.candidate);
  };

  pc2.ontrack = getRemoteStream;

  localStream.getTracks().forEach((track) => {
    pc1.addTrack(track, localStream);
  });

  var offerOptions = {
    offerToReceiveVideo: 1,
    offerToReceiveAudio: 0,
  };
  pc1.createOffer(offerOptions)
      .then(getOffer)
      .catch(handelOfferError);
}


function hangup() {
  pc1.close();
  pc2.close();

  pc1 = null;
  pc2 = null;
}


function getOffer(desc) {
  pc1.setLocalDescription(desc);

  // send desc to signal
  // receive desc from signal

  pc2.setRemoteDescription(desc);
  pc2.createAnswer()
      .then(getAnswer)
      .catch(handleAnsError);
}


function getAnswer(desc) {
  pc2.setLocalDescription(desc);

  // send desc to signal
  // receive desc from signal

  pc1.setRemoteDescription(desc);
}


function getRemoteStream(e) {
  remoteVideo.srcObject = e.streams[0];
}


function getMediaStream(stream) {
  localVideo.srcObject = stream;
  localStream = stream;
}


function handleAnsError(err) {
  alert(err);
}

function handelOfferError(err) {
  alert(err);
}

function handleError(err) {
  alert(err);
}

