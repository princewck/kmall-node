var express = require('express');
var router = express.Router();
var crypto = require('crypto');
var random = require('../../common/random');
var moment = require('moment');

router.get('/admin/sysuser', function(req, res) {
    var SUser = req.models.systemusers;
    SUser.find({status: 1}, function(err, data) {
        if (err) {
            console.log(err);
            return res.send(new req.Response(-1, null, '操作失败'));
        }
        res.send(new req.Response(0, data.map(function(d) {
            return d.getInfo();
        })));
    });
});

router.post('/admin/sysuser', function(req, res) {
    var username = req.body.username;
    var SUser = req.models.systemusers;  
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

router.post('/admin/sysuser/:id', function(req, res) {
    var params = req.body;
    var systemusers = req.models.systemusers;
    var response = new req.Response();
    if (!params.id) {
        response.setCode(-1);
        response.setMessage('用户id不存在');
        return res.send(response);
    }
    systemusers.get(params.id, function(err, user) {
        if (err || !user.id) {
            response.setCode(-2);
            response.setMessage('用户不存在');
            return res.send(response);
        }
        if (params.mail) user.mail = params.mail;
        if (params.username) user.username = params.username;
        if (params.nick) user.nick = params.nick;
        if (params.birthday) user.birthday = params.birthday;
        if (params.avatar) user.avatar = params.avatar;
        if (params.birthday) user.birthday = moment(params.birthday).format('YYYY-MM-DD HH:mm:ss');
        if (params.password) {
            var md5 = crypto.createHash('md5');
            params.salt = random.string(8);
            params.password = md5.update(params.password + params.salt).digest('hex');       
        }
        if ([0, 1].indexOf(Number(params.status))) params.status = Number(params.status);
        user.save(function(err) {
            if (err) {
                response.setCode(-3);
                response.setMessage('更新用户失败');
                return res.send(response);                
            }
            response.setMessage('更新成功！');
            return res.send(response);
        });
    });

});

router.post('/login', function(req, res) {  
    var username = req.body.username;
    var password = req.body.password;
    var Response = req.Response;
    var SUser = req.models.systemusers;
    var md5 = crypto.createHash('md5');
    if(!username || !password) return res.send(new Response(-1, null, '登录参数不合法!!'));
    SUser.find({username: username}, function(err, users) {
        if (err) return res.send(new Response(-10, null, '内部错误!'));
        if (users.length < 1) return res.send(new Response(-2, null, '用户名密码错误!'));
        var salt = users[0].salt;
        var decyroptedPwd = md5.update(password + salt).digest('hex');
        if (decyroptedPwd == users[0].password) {
            req.session.regenerate(function(err) {
                if (err) console.log('session regenerate failed');
                users[0].token = req.sessionID;
                users[0].token_expired = new Date(new Date().valueOf() + 3600000);
                req.session.user = users[0];       
                users[0].save(function(err) {
                    if (err) return res.send(new Response(-4, null, '登录失败！'));
                    return res.send(new Response(0, users[0].getInfo(), '登录成功！'));
                });                         
            });
        } else {
            res.send(new Response(-3, null, '用户名密码错误!'));   
        }
    });
});


router.post('/admin/logout', function(req, res, next) {
    req.session.destroy();
    res.send(new req.Response());
});






module.exports = router;