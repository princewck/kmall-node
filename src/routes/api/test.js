var express = require('express'),
    router = express.Router(),
    mailler = require('../../service/mailService'),
    mail = new mailler(),
    jwt = require('jsonwebtoken'),
    uuid = require('uuid'),
    fs = require('fs'),
    path = require('path'),
    crypto = require('crypto'),
    random = require('../../common/random.js');

router.post('/mail/send', function(req, res) {
    mail.send(null, '1046956843@qq.com', '测试邮件', null, '<h1>测试邮件 标题</h1>', function(info) {
        try {
            res.send(new Response(0, info));
        } catch (e) {
            res.send(new Response(-1, null, '发送失败=>'+e));
        }
    });
});

router.get('/publish/pic', function (req, res) {
    var pictures = [
        'http://img.alicdn.com/bao/uploaded/i4/T1AfpFFrldXXXXXXXX_!!0-item_pic.jpg',
        'http://img.alicdn.com/bao/uploaded/i4/TB1Um.wSpXXXXcaXFXXXXXXXXXX_!!0-item_pic.jpg',
        'http://img.alicdn.com/bao/uploaded/i3/TB1mt4oJFXXXXXhXVXXXXXXXXXX_!!0-item_pic.jpg'
    ];
    res.redirect(pictures[new Date().valueOf() % 3]);
});

router.get('/jwt/encode/:signature', function(req, res) {
    var cert = req.params.signature;
    var token = jwt.sign({ foo: 'wck' }, cert);
    res.send(token);
    // jwt.sign({ foo: 'bar' }, cert, { algorithm: 'RS256' }, function(err, token) {
    //     if (err) console.log(err);
    //     console.log(token);
    //     res.send(token);
    // });    
});

//不验证签名，只有完全可信的接口才能用
router.get('/jwt/decode/:token', function(req, res) {
    console.log(req.params.token);
    res.send(jwt.decode(req.params.token, function(err) {
        if (err) console.log(err);
    }));
});

//需要验证签名，更安全
router.get('/jwt/verify/:token', function(req, res) {
    jwt.verify(req.params.token, 'wck', function(err, decoded){
        if (err) res.send(err);
        res.send(decoded);
    });
});

//token 生成
router.get('/uuid', function(req, res) {
    res.send(uuid.v1());
});

router.get('/path', function(req, res) {
    var dir = path.resolve(__dirname, '../models');
    var list = fs.readdirSync(dir);
    res.send(list.map(function(data) {
        return data.toString().replace(/\.js/g, '').toLowerCase();
    }));
});

router.get('/md5', function(req, res) {
    var md5 = crypto.createHash('md5');
    res.send(md5.update('12345').digest('hex'));
});

router.get('/randomString', function(req, res) {
    res.send(new req.Response(0,random.string(100)));
});


router.get('/session', function(req, res) {
    res.send(req.session);
});

router.get('/testDuplicate/:name', function(req, res) {
    var Test = req.models.test;
    Test.create({
        id: 1,
        name: req.params.name || 'no name'
    }, function(err) {
        if (err) {
            if (err.code == 'ER_DUP_ENTRY') {
                Test.get(1, function(err, t){
                    if (err) res.send(err);
                    else {
                        t.name = req.params.name;
                    }
                    t.save(function(err) {
                        if (err) res.send(err);
                        else return res.send('success');
                    });
                })
            }
            else {
               res.send(err); 
            }
        }
        else res.send('success');
    });
})

module.exports = router;