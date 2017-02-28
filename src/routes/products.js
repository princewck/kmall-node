var express = require('express');
var router = express.Router();

router.route('/admin/categories')
    .get(function(req, res) {
        var Category = req.models.category;
        Category.all(function(err, categories) {
            if (err) res.send(new req.Response(-1, null, '获取数据失败'));
            res.send(new req.Response(0, categories));
        });
    })
    .post(function(req, res) {
        res.send(0);
    });

router.route('/admin/products')
    .get(function(req, res) {
        var Products = req.models.product.all(function(err, products) {
            res.send(products);
        });
    })
    .post(function(req, res) {

    });

module.exports = router;