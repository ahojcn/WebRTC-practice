'use strict';

var btnConn = document.querySelector('button#connserver');
var btnLeave = document.querySelector('button#leave');

var localVideo = document.querySelector('video#localvideo');
var remoteVideo = document.querySelector('video#remotevideo');

var localStream = null;
var remoteStream = null;

var roomid = '111111';
var socket = null;
var state = 'init';

var pc = null;

var textarea_offer = document.querySelector('textarea#textarea_offer');
var textarea_answer = document.querySelector('textarea#textarea_answer');

var optbw = document.querySelector('select#bandwidth');


var pcConfig = {
  'iceServers': [{
    'urls': 'turn:ahoj.luoshaoqi.cn:3478',
    'credential': '123456',
    'username': 'ahojcn'
  }]
};


btnConn.onclick = connSignalServer;
btnLeave.onclick = leave;
optbw.onchange = change_bw;

var bitrateGraph;
var bitrateSeries;
var packetGraph;
var packetSeries;

var lastResult;

window.setInterval(() => {
  var sender = pc.getSenders()[0];
  if (!sender) {
    return;
  }
  sender.getStats()
      .then(reports => {
        reports.forEach(report => {
          if (report.type === 'outbound-rtp') {
            if (report.isRemote) {
              return;
            }

            var curTs = report.timestamp;
            var bytes = report.bytesSent;
            var packets = report.packetsSent;
            if (lastResult && lastResult.has(report.id)) {
              var bitrate = 8 * (bytes - lastResult.get(report.id).bytesSent) / (curTs - lastResult.get(report.id).timestamp);
              bitrateSeries.addPoint(curTs, bitrate);
              bitrateGraph.setDataSeries([bitrateSeries]);
              bitrateGraph.updateEndDate();

              packetSeries.addPoint(curTs, packets - lastResult.get(report.id).packetsSent);
              packetGraph.setDataSeries([packetSeries]);
              packetGraph.updateEndDate();
            }
          }
        });

        lastResult = reports;
      })
      .catch(err => {
        console.log(err)
      });
}, 1000);


function change_bw() {
  optbw.disabled = true;
  var bw = optbw.options[optbw.selectedIndex].value;
  var vsender = null;
  var senders = pc.getSenders();

  senders.forEach(sender => {
    if (sender && sender.track.kind === 'video') {
      vsender = sender;
    }
  });

  var paramters = vsender.getParameters();
  if (!paramters.encodings) {
    return;
  }
  if (bw === 'unlimited') {
    return;
  }
  paramters.encodings[0].maxBitrate = bw * 1000;

  vsender.setParameters(paramters)
      .then(() => {
        optbw.disabled = false;
        console.log('success to set paramters')
      })
      .catch(err => {
        console.error(err)
      });
}


function connSignalServer() {
  // 开启本地音视频设备
  start();

  return true;
}

function start() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    alert('不支持');
  } else {
    var constraints = {
      video: true,
      audio: false
    };
    navigator.mediaDevices.getUserMedia(constraints)
        .then(getMediaStream)
        .catch((e) => {
          console.error(e);
        });
  }
}

function getMediaStream(stream) {
  if (localStream) {
    stream.getAudioTracks().forEach((track) => {
      localStream.addTrack(track);
      stream.removeTrack(track);
    });
  } else {
    localStream = stream;
  }

  localVideo.srcObject = localStream;

  conn();


  // 绘图
  bitrateSeries = new TimelineDataSeries();
  bitrateGraph = new TimelineGraphView('bitrateGraph', 'bitrateCanvas');
  bitrateGraph.updateEndDate();
  packetSeries = new TimelineDataSeries();
  packetGraph = new TimelineGraphView('packetGraph', 'packetCanvas');
  packetGraph.updateEndDate();
}

/* 信令部分 */
function conn() {
  socket = io.connect();  // 与信令服务器连接

  socket.on('joined', (roomid, id) => {
    state = 'joined';
    console.log('receive msg: joined', roomid, id, 'state = ', state);

    // 如果是多人的话，第一个人不应该在这里创建 PeerConnection
    // 都等到收到一个 otherjoin 时再创建
    // 所以，在这个消息里应该带当前房间的用户数
    createPeerConnection();

    btnConn.disabled = true;
    btnLeave.disabled = false;
  });

  socket.on('otherjoin', (roomid, id) => {
    if (state === 'joined_unbind') {
      createPeerConnection();
    }

    state = 'joined_conn';
    console.log('receive msg: otherjoin', roomid, id, 'state = ', state);

    call();
  });

  socket.on('full', (roomid, id) => {
    state = 'leaved';
    console.log('receive msg: full', roomid, id, 'state = ', state);

    socket.disconnect();
    closeLocalMedia();

    console.error('房间已满');
    btnConn.disabled = false;
    btnLeave.disabled = true;
  });

  socket.on('leaved', (roomid, id) => {
    state = 'leaved';
    console.log('receive msg: leaved', roomid, id, 'state = ', state);

    socket.disconnect();
    btnConn.disabled = false;
    btnLeave.disabled = true;
  });

  socket.on('bye', (roomid, id) => {
    /*
    * 当多人通话时，应该带上当前房间的用户数
    * 如果当前房间用户数不小于2，则不用修改状态
    * 并且，关闭的应该是对应用户的 PeerConnection
    * 在客户端应该维护一张PeerConnection表，它是一个key：value值，key=userid，value=PeerConnection
    **/

    state = 'joined_unbind';
    closePeerConnection();
    textarea_offer.value = '';
    textarea_answer.value = '';
    console.log('receive msg: bye', roomid, id, 'state = ', state);
  });

  socket.on('disconnect', (socket) => {
    console.log('disconnect message', roomid);
    if (!(state === 'leaved')) {
      hangup();
      closeLocalMedia();
    }
    state = 'leaved'
  });

  socket.on('message', (roomid, data) => {
    console.log('receive msg: message', roomid, data);
    /* 媒体协商 */
    if (data) {
      if (data.type === 'offer') {
        textarea_offer.value = data.sdp;

        pc.setRemoteDescription(new RTCSessionDescription(data));

        pc.createAnswer()
            .then(getAnswer)
            .catch((e) => {
              console.error(e);
            });

      } else if (data.type === 'answer') {
        textarea_answer.value = data.sdp;
        optbw.disabled = false;  ////////
        pc.setRemoteDescription(new RTCSessionDescription(data));

      } else if (data.type === 'candidate') {
        var candidate = new RTCIceCandidate({
          sdpMLineIndex: data.label,
          candidate: data.candidate
        });
        pc.addIceCandidate(candidate);

      } else {
        console.error('data type error');
        // console.log(data);
      }
    }
  });

  socket.emit('join', '111111');  // 加入房间 111111
}

function hangup() {
  if (pc) {
    pc.close();
    pc = null;
  }
}

/* 退出时关闭 track 流 */
function closeLocalMedia() {
  if (localStream && localStream.getTracks()) {
    localStream.getTracks().forEach((track) => {
      track.stop();
    });
  }
  localStream = null;
}

function leave() {
  if (socket) {
    socket.emit('leave', '111111');  // 离开房间 111111
  }

  /* 释放资源 */
  closePeerConnection();
  closeLocalMedia();

  textarea_offer.value = '';
  textarea_answer.value = '';

  btnConn.disabled = false;
  btnLeave.disabled = true;
}

function createPeerConnection() {
  // 如果是多个人的话，这里要创建一个新的连接
  // 新连接创建好的要放在一个 map 表中
  // key=userid value=PeerConnection
  console.log('create RTCPeerConnection!');
  if (!pc) {
    pc = new RTCPeerConnection(pcConfig);

    pc.onicecandidate = (e) => {

      if (e.candidate) {
        sendMessage(roomid, {
          type: 'candidate',
          label: event.candidate.sdpMLineIndex,
          id: event.candidate.sdpMid,
          candidate: event.candidate.candidate
        });
      } else {
        console.log('this is the end candidate');
      }

    };

    pc.ontrack = getRemoteStream;

  } else {
    console.log('the pc have be created')
  }

  if ((localStream !== null || localStream !== undefined) && (pc !== null || pc !== undefined)) {
    localStream.getTracks().forEach((track) => {
      pc.addTrack(track, localStream);  // 进行添加, 并发送给远端。
    });
  } else {
    console.log('pc or localStream is null or undefined');
  }

}  /* createPeerConnection */

function closePeerConnection() {
  console.log('close RTCPeerConnection!');
  if (pc) {
    pc.close();
    pc = null;
  }
}

function getRemoteStream(e) {
  remoteStream = e.streams[0];
  remoteVideo.srcObject = e.streams[0];
}

function call() {
  if (state === 'joined_conn') {

    var options = {
      offerToReceiveVideo: 1,
      offerToReceiveAudio: 0,
    };
    pc.createOffer(options)
        .then(getOffer)
        .catch((e) => {
          console.error(e);
        });

  }
}

function getOffer(desc) {
  pc.setLocalDescription(desc);
  textarea_offer.value = desc.sdp;
  sendMessage(roomid, desc);
}

function getAnswer(desc) {
  pc.setLocalDescription(desc);
  textarea_answer.value = desc.sdp;

  optbw.disabled = false;
  sendMessage(roomid, desc);
}

function sendMessage(roomid, data) {
  console.log('send p2p message', roomid, data);
  if (socket) {
    socket.emit('message', roomid, data);
  }
}
