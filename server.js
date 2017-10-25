"use strict";
exports.__esModule = true;
var path = require("path");
var express = require("express");
var app = express();
var port = process.env.PORT || 3000;
//app.use(express.static('dist'))
app.use('/dist', express.static(path.join(__dirname, 'dist')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, 'index.html'));
});
app.listen(port, function () { return console.log('Listening on ' + port); });
