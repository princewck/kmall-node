var express = require('express');
var router = express.Router();

/**
 * 获取首页banner列表
 */
router.route('/admin/banners')
    .get(function(req, res) {
        var config = {
            module: 'index',
            code: 'banner'
        };
        getConfig(req, res, config);
    })
    .post(function(req, res) {
        var banners = req.body.banners || '[]';
        setConfig(req, res, {
            module: 'index',
            code: 'banner',
            value: banners
        });
    });

/**
 * 首页主导航链接
 */
router.route('/admin/navbars')
    .get(function(req, res) {
        var config = {
            module: 'index',
            code: 'navbar'
        }
        getConfig(req, res, config);
    })
    .post(function(req, res) {
        var navbars = req.body.navbars || '[]';
        setConfig(req, res, {
            module: 'index',
            code: 'navbar',
            value: navbars
        });
    });

/**
 * 活动专区
 */
router.route('/admin/blockGroups')
    .get(function(req, res) {
        var config = {
            module: 'index',
            code: 'block_group'
        }
        getConfig(req, res, config);
    })
    .post(function(req, res) {
        var blockGroup = req.body.blockGroup || '';
        setConfig(req, res, {
            module: 'index',
            code: 'block_group',
            value: blockGroup
        });
    });


function setConfig(req, res, config) {
    const Response = req.Response;
    const Configuration = req.models.configurations;
    if (!config.module || !config.code || !config.value) 
        return res.send(new Response(-1, null, '参数错误'));
    Configuration.find({module: config.module, code: config.code}, function(err, configs) {
        if (err) return res.send(new Response(-2, null , err));
        if (!configs.length) res.send(new Response(-3, null, '配置不存在，请完善相关基础配置项'));
        var configuration = configs[0];
        configuration.value = config.value;
        configuration.save(function(err) {
            if (err) return res.send(new Response(-4, null, err));
            return res.send(new Response());
        });
    });
}

function getConfig(req, res, config) {
    if (!config.module || !config.code) 
        return res.send(new Response(-1, null, '参数错误'));
    var Configuration = req.models.configurations;
    var Response = req.Response;
    Configuration.find({
        module: config.module,
        code: config.code
    }, function(err, configSets) {
        if (err) return res.send(new Response(-1, null, err));
        if (!configSets.length)  return res.send(new Response(-2, null, '配置不存在，请完善相关基础配置项'));
        return res.send(new Response(0, JSON.parse(configSets[0]['value'])));
    });    
}

module.exports = router;