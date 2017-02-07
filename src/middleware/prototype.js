/*
 *change prototype of request body to Object.prototype
 */
var express = require('express');
var app = express();
app.use('/', function(req, res, next) {
    var requestBody = req.body;
    var newBody = {};
    for (k in requestBody) {
        newBody[k] = requestBody[k];
    }
    req.body = newBody;
    next();
});
module.exports = app;