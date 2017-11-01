"use strict";
exports.__esModule = true;
var path = require("path");
var Http = require("http");
var express = require("express");
var socketIo = require("socket.io");
var app = express();
var port = process.env.PORT || 3000;
var server = Http.createServer(app);
var io = socketIo(server);
//app.use(express.static('dist'))
app.use('/dist', express.static(path.join(__dirname, 'dist')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, 'index.html'));
});
app.listen(port, function () { return console.log('Listening on ' + port); });
io.on('connect', function (_) { });
