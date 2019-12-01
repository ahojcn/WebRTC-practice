'use strict';

var username = document.querySelector('input#username');
var room_input = document.querySelector('input#room');
var btn_connect = document.querySelector('button#connect');
var output_text = document.querySelector('textarea#output');
var input_text = document.querySelector('textarea#input');
var btn_send = document.querySelector('button#send');

var socket;
var room;

btn_connect.onclick = () => {
  // 连接服务器
  socket = io.connect();
  // 接收消息
  socket.on('joined', (room, id) => {
    btn_connect.disabled = true;
    input_text.disabled = false;
    btn_send.disabled = false;
  });

  socket.on('leave', (room, id) => {
    btn_connect.disabled = false;
    input_text.disabled = true;
    btn_send.disabled = true;
  });

  socket.on('message', (room, data) => {
    output_text.value = output_text.value + data + '\r';
  });
  // 发送消息
  room = room_input.value;
  socket.emit('join', room);
};

btn_send.onclick = () => {
  var data = input_text.value;
  data = username.value + ':' + data;
  socket.emit('message', room, data);
  input_text.value = '';
};
