var express = require('express');
var app = express();
var orm = require('orm');
var fs = require('fs');
var path = require('path');

//ORM支持
app.use(orm.express("mysql://root:@localhost/kmall?pool=true", {
    define: function (db, models) {
        var dir = path.resolve(__dirname, '../models');
        fs.readdir(dir, function(err, files) {
            if (err) return console.log('加载 models/* 模型数据出错');
            files.forEach(function(fileName) {
                var filePath = dir + '/' + fileName;
                var model = String(fileName).replace(/\.js/g, '');
                model = model[0].toUpperCase() + (model.length > 1 ? model.substring(1, model.length) : '');
                models[model] = db.load(filePath, function(err, cb) {
                    if (err) console.log(model + ': loading error =>', err); 
                });
            });
        });
    }
}));

module.exports = app;