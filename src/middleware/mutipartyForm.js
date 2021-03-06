//文件上传的鉴权

var express = require('express');
var router = express.Router();
var multiparty = require('multiparty');

router.use(function(req, res, next) {
    // var form = new multiparty.Form();
    var token = null;
    var session = req.session;
    try {
        form.parse(req, function(err, fields, files) {
            token = token || fields['K-Session'][0];
            if (session.user && session.user.token && session.user.token == token) {
                console.log('用户'+ (session.user.username || '') +'认证通过');
                next();
            } else {
                res.status(401).send(new req.Response(-401, null, 'authentication failed'));
            }            
        });        
    } catch(e) {
        return res.status(401).send(new req.Response(-401, null, 'authentication failed'));
        console.log(e);
    }
});

module.exports = router;