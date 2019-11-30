'use strict';

var http = require('http');
var https = require('https');
var fs = require('fs');

var express = require('express');
var serveIndex = require('serve-index');


let app = express();
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
https_server.listen(443, '0.0.0.0');
