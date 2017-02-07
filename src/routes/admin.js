//管理端会用到的api，需要token才能访问
var express = require('express');
var cookie = require('cookie-parser');
var bodyParser = require('body-parser');
var router = express.Router();
var app = express();
// var Response = require('../common/response');


//首页banner图获取和更新
router.get('/admin/index/banners', function(req, res) {
        const Response = req.Response;
        const Configuration = req.models.Configuration;
        Configuration.find({module: 'index', code: 'banner'}, function(err, configs) {
            if (err) console.log(err);
            res.send(new Response(0, configs[0]));
        });
    });

router.post('/admin/index/banners', function(req, res) {
    const Configuration = req.models.Configuration;
    const Response = req.Response;
    Configuration.find({module: 'index', code: 'banner'}, function(err, configurations) {
        if (err) console.log(err);
        if (!configurations.length) return res.send(new Response(-2, null, '不存在该配置项'));
        var params = req.body;
        console.log(params.value);
        if (params.value) configurations[0].value = params.value;
        configurations[0].save(function(err) {
            if (err) return res.send(new Response(-1, null, '更新数据失败'));
            res.send(new Response(0, configurations[0]));
        });
    });
});

module.exports = router;