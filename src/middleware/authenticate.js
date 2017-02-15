var express = require('express');
var router = express.Router();

router.use(function(req, res, next) {
    console.log(req.headers);
    var token = req.headers['k-session'];
    var session = req.session;
    if (session.user && session.user.token && session.user.token == token) {
        console.log('用户认证通过');
        next();
    } else {
        res.status(401).send(new req.Response(-401, null, 'authentication failed'));
    }
});

module.exports = router;