'use strict';

var http = require('http');
var https = require('https');
var fs = require('fs');

var express = require('express');
var serveIndex = require('serve-index');

var socketIo = require('socket.io');


var app = express();
app.use(serveIndex('./public'));
app.use(express.static('./public'));

// http server
var http_server = http.createServer(app);
http_server.listen(8087, '0.0.0.0');


// https server
var options = {
  key: fs.readFileSync('./cret/3162249_ahoj.luoshaoqi.cn.key'),
  cert: fs.readFileSync('./cret/3162249_ahoj.luoshaoqi.cn.pem')
};
var https_server = https.createServer(options, app);

var io = socketIo.listen(https_server);
io.sockets.on('connection', (socket) => {
  socket.on('message', (room, data)=>{
    io.in(room).emit('message',room, data);
  });

  socket.on('join', (room) => {
    socket.join(room);
    var myRoom = io.sockets.adapter.rooms[room];
    var users = Object.keys(myRoom.sockets).length;
    // socket.emit('joined', room, socket.id);  // 给本人回消息
    // socket.to(room).emit('joined', room, socket.id);  // 给房间出自己外所有人回消息
    // io.in(room).emit('joined', room, socket.id);  // 给房间所有人发消息
    socket.broadcast.emit('joined', room, socket.id);  // 给站点所有人发消息，除了自己
  });

  socket.on('leave', (room) => {
    var myRoom = io.sockets.adapter.rooms[room];
    var users = Object.keys(myRoom.sockets).length;
    socket.leave(room, ()=>{});
    // socket.emit('joined', room, socket.id);  // 给本人回消息
    // socket.to(room).emit('joined', room, socket.id);  // 给房间出自己外所有人回消息
    // io.in(room).emit('joined', room, socket.id);  // 给房间所有人发消息
    socket.broadcast.emit('leave', room, socket.id);  // 给站点所有人发消息，除了自己
  });
});
https_server.listen(443, '0.0.0.0');
