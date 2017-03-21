var express = require('express');
var app = express();
var orm = require('orm');
var fs = require('fs');
var path = require('path');
var configuration = require('../.config');

//ORM支持
app.use(orm.express(configuration.mysqlConfig, {
    define: function (db, models) {
        var dir = path.resolve(__dirname, '../models');
        fs.readdir(dir, function(err, files) {
            if (err) return console.log('加载 models/* 模型数据出错');
            var hasManys = {};
            files.forEach(function(fileName) {
                var filePath = dir + '/' + fileName;
                var model = String(fileName).replace(/\.js/g, '');
                model = model.toLowerCase();
                models[model] = db.load(filePath, function(err, cb) {
                    if (err) console.log(model + ': loading error =>', err); 
                });
                //关联关系
                if (require(filePath).hasMany instanceof Array) {
                    hasManys[model] = require(filePath).hasMany;
                }
            });

            for (k in hasManys) {
                var args = hasManys[k]; 
                var m = args.splice(1, 1);
                args.splice(1, 0, models[m]);
                models[k].hasMany.apply(models[k], args);
            }
            db.sync();
        });
    }
}));

module.exports = app;