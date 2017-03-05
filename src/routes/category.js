var express = require('express');
var router = express.Router();
var orm = require('orm');

router.route('/admin/categories')
    .get(function(req, res) {
        let Response = req.Response;
        let Category = req.models.category;
        let resp = new Response();
        Category.all(function(err, categories) {
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

    /**创建分类*/
    router.post('/admin/category', function(req, res) {
        let Response = req.Response;
        let Category = req.models.category;
        let params = req.body;
        let category = {
            name: params.name || null,
            description: params.description || '',
            sort: params.sort || 0,
            status: true
        }
        if (!category.name) return res.send(new Response(-1, null, '名称不可以为空'));
        Category.create(category, function(err) {
            if (err) return consle.log(err),res.send(new Response(-2, null, '新增分类失败！'));
            return res.send(new Response());
        })
    });

    router.route('/admin/category/:categoryId')
        .get(function(req, res) {
            let Response = req.Response;
            let Category = req.models.category;
            let categoryId = req.params.categoryId;          
            if (isNaN(categoryId)) return res.send(new Response(-1, null, '参数不合法'));
            Category.get(categoryId, function(err, cate) {
                if (err) return res.send(new Response(-2, null, err));
                return res.send(new Response(0, cate));
            })
        })
        .post(function(req, res) {
            let Response = req.Response;
            let Category = req.models.category;
            let categoryId = req.params.categoryId;
            let params = req.body;
            if (isNaN(categoryId)) return res.send(new Response(-1, null, '参数不合法,id未知定'));
            Category.get(categoryId, function(err, cate) {
                if (err) return res.send(err);
                for(k in cate) {
                    if (params.hasOwnProperty(k)) {
                        cate[k] = params[k];
                    }
                }
                cate.save(function(err) {
                    if (err) return res.send(new Response(-2, err.message));
                    return res.send(new Response(0, cate));
                });
            });    

        });

        router.post('/admin/category/:categoryId/del', function(req, res) {
            let Response = req.Response;
            let Category = req.models.category;
            if (isNaN(req.params.categoryId)) return res.send(new Response(-1, null, '参数缺失！'));
            Category.get(req.params.categoryId, function(err, cate) {
                if (err) return res.send(new Response(-2, null, err.message));
                cate.remove(function(err) {
                    if (err) return res.send(new Response(-2, null, err.message));
                    return res.send(new Response());
                });
            })
        });


module.exports = router;