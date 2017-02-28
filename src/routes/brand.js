var express = require('express');
var router = express.Router();
var orm = require('orm');

//获取所有品牌
router.route('/admin/brands')
    .get(function(req, res) {
        var Brand = req.models.brand;
        Brand.find({status: true}, function(err, brands) {
            if (err) res.send(new req.Response(-1, null, '获取数据失败'));
            res.send(new req.Response(0, brands));
        });
    })
    .post(function(req, res) {
        var Brand = req.models.brand;
        brands = req.body.brands;
        if (!brands instanceof Array) return res.send(new req.Response(-2, null,'参数错误，expected:品牌数组'));
        var hasInvalid = false;
        brands = brands.map(function(brand) {
            if (!brand.name) hasInvalid = true;
            return {
                name: brand.name,
                image: brand.image || null,
                description: brand.description || null,
                sort: brand.sort || 0
            }
        });
        if (hasInvalid) return res.send(new req.Response(-3, null, '参数不正确，请检查是否存在参数不合法的项目'));
        Brand.create(brands, function(err, items) {
            if (err) return res.send(new req.Response(-1, null, err.message));
            return res.send(new req.Response(0 , '创建成功'));
        });
    });

//新建品牌
router.post('/admin/brand', function(req, res) {
    var Brand = req.models.brand;
    var param = req.body;
    var brand = {
        name: param.name || null,
        image: param.image || null,
        description: param.description || null,
        status: 1,
        sort: param.sort || 0
    }
    if (!brand.name) return res.send(new req.Response(-2, null, '参数不合法'));
    Brand.create(brand, function(err, items) {
        if (err) return res.send(new res.Response(-1, null, '新建品牌失败！'));
        return res.send(new req.Response(0, items));
    });
});

//修改品牌
router.route('/admin/brand/:brandId')
    .post(function(req, res) {
        var Brand = req.models.brand;
        const brandId = req.params.brandId;
        if(!brandId) res.send(new req.Response(-1, null, '品牌id缺失，无法更新！'));
        Brand.get(brandId, function(err, brand) {
            if (!brand) return res.send(new req.Response(-2, null, '用户不存在'));
            for (k in req.body) {
                if (brand.hasOwnProperty(k) && k != 'id') {
                    brand[k] = req.body[k];
                }
            }
            brand.save(function(err) {
                if (err) return res.send(new req.Response(-2, null, '更新失败'));
                return res.send(new req.Response());
            });
        })
    })
    .get(function(req, res) {
        const brandName = req.body.name;
        const Brand = req.models.brand;
        Brand.get(req.params.brandId, function(err, brand) {
            if (err) return res.send(new req.Response(-1, null, err.message));
            return res.send(new req.Response(0, brand));
        });         
    });


//删除品牌
router.post('/admin/brand/:brandId/delete', function(req, res) {
    const Brand = req.models.brand;
    const brandId = req.params.brandId;
    if (!brandId) return res.send(new req.Response(-1, null, '要删除的品牌未指定'));
    Brand.get(brandId, function(err, brand) {
        if (err) return res.send(new req.Response(-2, null, err.message));
        brand.remove(function(err) {
            if (err) return res.send(new req.Response(-3, null, err.message));
            return res.send(new req.Response());
        }); 
    });
});

//查找品牌 @params {string} brandName
router.post('/admin/brands/find', function(req, res) {
    const brandName = req.body.name;
    const Brand = req.models.brand;
    const Response = req.Response;
    Brand.find({name: orm.like('%' + brandName + '%')}, function(err, brands) {
        if (err) return res.send(new Response(-1, null, err.message));
        return res.send(new Response(0, brands));
    });
});

module.exports = router;