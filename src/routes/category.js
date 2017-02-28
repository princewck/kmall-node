var express = require('express');
var router = express.Router();
var orm = require('orm');

router.route('/admin/categories')
    .get(function(req, res) {
        let Response = req.Response;
        let Category = req.models.category;
        let resp = new Response();
        Category.find({status: true}, function(err, categories) {
            if (err) return resp.setCode(-1),res.send(resp);
            return resp.setData(categories),res.send(resp);
        });
    })
    .post(function(req, res) {
        let Response = req.Response;
        let Category = req.models.category;
        let categories = req.body.categories;
        if (! categories instanceof Array) return res.send(new Response(-1, null, '参数错误'));
        let hasInvalid = false;
        categories = categories.map(function(category) {
            if (!category.name) hasInvalid = true; 
            return {
                name: category.name,
                description: category.description || null,
                sort: category.sort || 0,
                status: true
            }
        });
        if (hasInvalid) return res.send(new Response(-2, null, '参数不完整'));
        Category.create(categories, function(err) {
            if (err) return res.send(new req.Response(-3, null, err.message));
            return res.send(new req.Response(0 , '创建成功'));            
        });
    });

module.exports = router;