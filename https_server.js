'use strict'

var https = require('https');
var fs = require('fs');

var options = {
    key: fs.readFileSync('./cret/3162249_ahoj.luoshaoqi.cn.key'),
    cert: fs.readFileSync('./cret/3162249_ahoj.luoshaoqi.cn.pem')
}

var app = https.createServer(options, function (req, res) {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end("hello https\n");
}).listen(443, '0.0.0.0');
