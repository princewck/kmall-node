var express = require('express');
var router = express.Router();
// var crypt = require('crypt');
var orm = require('orm');
var unicode = require('../../common/unicodeConverter');

router.post('/admin/url/short', function (req, res) {
    var ShortUrl = req.models.short_url;
    var Response = req.Response;
    var url = req.body.url;
    var description = req.body.description || '';
    if (url) {
        ShortUrl.aggregate({ id: orm.gt(0) }).max('id').get(function (err, maxId) {
            if (err) {
                return res.send(new Response(-1, null, err));
            } else {
                var newId = Number(maxId) + 1;
                var b = new Buffer(String(newId));
                var base64Id = b.toString('base64');
                console.log(newId, base64Id);
                ShortUrl.create({
                    url: url,
                    short_url_id: base64Id,
                    status: true,
                    description: description
                }, function (err, url) {
                    if (err) {
                        return res.send(new Response(-3, null, err));
                    } else {
                        return res.send(new Response(0, url));
                    }
                });
            }
        });
    } else {
        return res.send(new Response(-2, null, 'url 不合法'));
    }
});

/**
 * 动态转换短连接用此接口
 */
router.post('/web/url/short', function (req, res) {
    var ShortUrl = req.models.short_url;
    var Response = req.Response;
    var url = req.body.url;
    var description = req.body.description || '';
    if (url) {
        ShortUrl.aggregate({ id: orm.gt(0) }).max('id').get(function (err, maxId) {
            if (err) {
                return res.send(new Response(-1, null, err));
            } else {
                var newId = Number(maxId) + 1;
                var b = new Buffer(String(newId));
                var base64Id = b.toString('base64');
                console.log(newId, base64Id);
                ShortUrl.create({
                    url: url,
                    short_url_id: base64Id,
                    status: false,
                    description: description
                }, function (err, url) {
                    if (err) {
                        return res.send(new Response(-3, null, err));
                    } else {
                        return res.send(new Response(0, "/api/u/" + url.short_url_id, '获取商品链接成功'));
                    }
                });
            }
        });
    } else {
        return res.send(new Response(-2, null, 'url 不合法'));
    }
});


router.post('/admin/url/short/:id/disable', function(req, res) {
    var id = req.params.id;
    var Response = req.Response;
    var ShortUrl = req.models.short_url;
    if (!id) {
        return res.send(new Response(-1, null, 'id不能为空'));
    } else {
        ShortUrl.get(id, function(err, urlInstance) {
            if (err) {
                return res.send(new Response(-2, null, err));
            } else {
                urlInstance.status = false;
                urlInstance.save(function(err, url) {
                    if (err) {
                        return res.send(new Response(-3, null, err));
                    } else {
                        return res.send(new Response(0, url));
                    }
                });
            }
        });
    }
});


router.get('/admin/url/short', function (req, res) {
    var ShortUrl = req.models.short_url;
    var Response = req.Response;
    ShortUrl.all(function (err, urls) {
        if (err) {
            return res.send(new Response(-1, null, err));
        } else {
            return res.send(new Response(0, urls));
        }
    });
});

router.get('/u/:shortUrlId', function (req, res) {
    var ShortUrl = req.models.short_url;
    var shortUrlId = req.params.shortUrlId;
    if (!shortUrlId) {
        res.writeHead(301, { 'Location': 'quanerdai.com' });
        console.log(res._header);
        return res.end();
    } else {
        ShortUrl.find({ short_url_id: shortUrlId }, function (err, urlInstances) {
            if (err) {
                res.writeHead(301, { 'Location': 'quanerdai.com' });
                console.log(res._header);
                return res.end();
            } else {
                var url = urlInstances[0].url;
                url = unicode(url);
                console.log(url);
                res.writeHead(302, {'Location': url});
                console.log(res._header);
                return res.end();
            }
        });
    }
});
module.exports = router;