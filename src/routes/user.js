var express = require('express');
var router = express.Router();
var crypto = require('crypto');
var random = require('../common/random');
var uuid = require('uuid');

router.get('/admin/sysuser', function(req, res) {
    res.json(req.session);
    return ;
    var SUser = req.models.SystemUsers;
    SUser.find({status: 1}, function(err, data) {
        if (err) {
            console.log(err);
            res.send(new req.Response(-1, null, '操作失败'));
        }
        res.send(new req.Response(0, data.map(function(d) {
            return d.getInfo();
        })));
    });
});

router.all('/admin/sysuser/add', function(req, res) {
    var username = req.body.username;
    var SUser = req.models.SystemUsers;  
    var md5 = crypto.createHash('md5');
    var params = req.body;
    params.status = params.status || 1;
    params.salt = random.string(8);
    params.password = md5.update(params.password + params.salt).digest('hex');
    SUser.find({username: username}, function(err, users) {
        if (err) console.log(err);
        if (users.length) {
            return res.send(new req.Response(-1, null, '该用户已存在'));
        }
        try {
            SUser.create(params, function(err) {
                if(err) {
                    console.log(err);
                    res.send(new req.Response(-2, null, '创建用户失败:' + err));
                } else  {
                    res.send(new req.Response(0, null, '创建用户成功！'));
                }
            });        
        } catch (e) {
            console.log(e);
            res.send(new req.Response(-3, null, '创建用户失败'));
        }        
    });      
});

router.post('/admin/login', function(req, res) {  
    var username = req.body.username;
    var password = req.body.password;
    var Response = req.Response;
    var SUser = req.models.SystemUsers;
    var md5 = crypto.createHash('md5');
    if(!username || !password) return res.send(new Response(-1, null, '登录参数不合法!!'));
    SUser.find({username: username}, function(err, users) {
        if (err) return res.send(new Response(-10, null, '内部错误!'));
        if (users.length < 1) return res.send(new Response(-2, null, '用户名密码错误!'));
        var salt = users[0].salt;
        var decyroptedPwd = md5.update(password + salt).digest('hex');
        if (decyroptedPwd == users[0].password) {
            users[0].token = req.sessionID;
            req.session.user = users[0];
            req.session.save(function(err) {
                if (err) console.log('session saving failed');
                console.log('logined and session user saved');
            });
            users[0].save(function(err) {
                if (err) return res.send(new Response(-4, null, '登录失败！'));
                return res.send(new Response(0, users[0], '登录成功！'));
            });
        } else {
            res.send(new Response(-3, null, '用户名密码错误!'));   
        }
    });
});




module.exports = router;