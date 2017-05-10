var express = require('express');
var router = express.Router();
var multiparty = require('multiparty');

router.use(function(req, res, next) {
    // var form = new multiparty.Form();
    var token = req.headers['k-session'];
    var session = req.session;
    var User = req.models.systemusers;
    // try {
    //     form.parse(req, function(err, fields, files) {
    //         token = token || fields['K-Session'][0];
    //         console.log(token);
    //     });        
    // } catch(e) {
    //     console.log(e);
    // }
    if (session.user && session.user.token && session.user.token == token) {
        //刷新token过期时间
        User.get(session.user.id, function(err, user) {
            if (err) {
                console.error('token 过期时间刷新时出错！');
            }
            else {
                console.log('时间对比');
                console.log(new Date(user.token_expired).valueOf(), new Date().valueOf());
                if (new Date(user.token_expired).valueOf() - new Date().valueOf() < 0) {
                    console.error('token expired');
                    return res.status(401).send(new req.Response(-401, null, 'token expired, authentication failed'));
                } else {
                    user.token_expired = new Date(new Date().valueOf() + 3600000);
                    user.save(function(err) {
                        err && console.error('token 过期时间刷新失败！');
                    });
                    next();
                }
            }
        });
    } else {
        res.status(401).send(new req.Response(-401, null, 'authentication failed'));
    }
});

module.exports = router;