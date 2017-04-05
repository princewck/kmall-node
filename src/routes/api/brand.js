var express = require('express');
var router = express.Router();
var orm = require('orm');

//获取所有品牌
router.route('/admin/brands')
    .get(function (req, res) {
        var Brand = req.models.brand;
        Brand.find({}, function (err, brands) {
            if (err) res.send(new req.Response(-1, null, '获取数据失败'));
            res.send(new req.Response(0, brands));
        });
    })
    .post(function (req, res) {
        var Brand = req.models.brand;
        brands = req.body.brands;
        if (!brands instanceof Array) return res.send(new req.Response(-2, null, '参数错误，expected:品牌数组'));
        var hasInvalid = false;
        brands = brands.map(function (brand) {
            if (!brand.name) hasInvalid = true;
            return {
                name: brand.name,
                image: brand.image || null,
                description: brand.description || null,
                sort: brand.sort || 0
            }
        });
        if (hasInvalid) return res.send(new req.Response(-3, null, '参数不正确，请检查是否存在参数不合法的项目'));
        Brand.create(brands, function (err, items) {
            if (err) return res.send(new req.Response(-1, null, err.message));
            return res.send(new req.Response(0, '创建成功'));
        });
    });

//获取所有品牌
router.route('/web/brands')
    .get(function (req, res) {
        var Brand = req.models.brand;
        Brand.find({ status: true }, function (err, brands) {
            if (err) res.send(new req.Response(-1, null, '获取数据失败'));
            res.send(new req.Response(0, brands));
        });
    }); 

//新建品牌
router.post('/admin/brand', function (req, res) {
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
    Brand.create(brand, function (err, items) {
        if (err) return res.send(new res.Response(-1, null, '新建品牌失败！'));
        return res.send(new req.Response(0, items));
    });
});

//修改品牌
router.route('/admin/brand/:brandId')
    .post(function (req, res) {
        var Brand = req.models.brand;
        const brandId = req.params.brandId;
        if (!brandId) res.send(new req.Response(-1, null, '品牌id缺失，无法更新！'));
        Brand.get(brandId, function (err, brand) {
            if (!brand) return res.send(new req.Response(-2, null, '品牌不存在'));
            for (k in req.body) {
                if (brand.hasOwnProperty(k) && k != 'id') {
                    brand[k] = req.body[k];
                }
            }
            brand.save(function (err) {
                if (err) return res.send(new req.Response(-3, null, '更新失败'));
                return res.send(new req.Response());
            });
        })
    })
    .get(function (req, res) {
        const brandName = req.body.name;
        const Brand = req.models.brand;
        Brand.get(req.params.brandId, function (err, brand) {
            if (err) return res.send(new req.Response(-1, null, err.message));
            return res.send(new req.Response(0, brand));
        });
    });

router.get('/web/brand/:brandId', function (req, res) {
        const brandName = req.body.name;
        const Brand = req.models.brand;
        Brand.get(req.params.brandId, function (err, brand) {
            if (err) return res.send(new req.Response(-1, null, err.message));
            return res.send(new req.Response(0, brand));
        });
    });

//删除品牌
router.post('/admin/brand/:brandId/delete', function (req, res) {
    const Brand = req.models.brand;
    const brandId = req.params.brandId;
    if (!brandId) return res.send(new req.Response(-1, null, '要删除的品牌未指定'));
    Brand.get(brandId, function (err, brand) {
        if (err) return res.send(new req.Response(-2, null, err.message));
        brand.remove(function (err) {
            if (err) return res.send(new req.Response(-3, null, err.message));
            return res.send(new req.Response());
        });
    });
});

//查找品牌 @params {string} brandName
router.post('/admin/brands/find', function (req, res) {
    const brandName = req.body.name;
    const Brand = req.models.brand;
    const Response = req.Response;
    Brand.find({ name: orm.like('%' + brandName + '%') }, function (err, brands) {
        if (err) return res.send(new Response(-1, null, err.message));
        return res.send(new Response(0, brands));
    });
});

//根据一级分类和二级分类过滤品牌
router.route('/web/categoryGroup/:groupId/brands')
    .get(function (req, res) {
        const groupId = req.params.groupId;
        const Response = req.Response;
        const Category = req.models.category;
        const Brands = req.models.brands;
        const categoryGroup = req.models.category_group;
        const categoryIds = req.body.categoryIds;
        if (!groupId || isNaN(groupId)) return new Response(-1, null, '参数错误');
        categoryGroup.get(groupId, function (err, group) {
            if (err) return res.send(new Response(-2, null, err));
            var categories = group.categories;
            if (categoryIds && categoryIds.length) {
                categories = categories.filter(function(c) {
                    return categoryIds.indexOf(c.id) >= 0;
                });
            }
            Category.find({id: categories.map((c)=>(c.id))}, function(err, categories) {
                if (err) return res.send(new Response(-3, null, err));
                var brands = [];
                var map = {};
                categories.forEach(function(c) {
                    c.brands.forEach(function(b) {
                        if (!map.hasOwnProperty(b.id)) {
                            brands.push(b);
                            map[b.id] = 1;
                        }
                    });
                });
                return res.send(new Response(0, brands));
            });
        });
    })

/**
 * 根据分类获取品牌
 */
router.route('/admin/category/:categoryId/brands')
    .get(function (req, res) {
        const categoryId = req.params.categoryId;
        const Response = req.Response;
        const Category = req.models.category;
        if (!categoryId || isNaN(categoryId)) return new Response(-1, null, '参数错误');
        Category.get(categoryId, function (err, category) {
            if (err) return res.send(new Response(-2, null, err));
            category.getBrands(function (err, brands) {
                if (err) return res.send(new Response(-3, null, err));
                return res.send(brands);
            });
        });
    })
    .post(function (req, res) {
        /**
         * 为一个分类设置品牌
         */
        const Category = req.models.category;
        const Brand = req.models.brand;
        const categoryId = req.params.categoryId;
        const Response = req.Response;
        if (!categoryId || isNaN(categoryId)) return new Response(-1, null, '参数错误, {brandIds:[Integer brandId,...]}');
        var brandIds = req.body.brandIds;
        if (!brandIds || isNaN(categoryId) || !(brandIds instanceof Array) || !brandIds.length || brandIds.some(function (id) {
            return isNaN(id);
        })) {
            return res.send(new Response(-3, null, '参数不合法'));
        }
        Category.get(categoryId, function (err, category) {
            if (err) return res.send(new Response(-4, null, err));
            Brand.find({ status: true }).where('id in (' + brandIds.join(',') + ')').all(function (err, brands) {
                if (err) return res.send(new Response(-5, null, err));
                category.setBrands(brands, function (err) {
                    if (err) return res.send(new Response(-6, null, err));
                    return res.send(new Response());
                });
            });
        });
    });

router.post('/admin/brand/:brandId/categories', function (req, res) {
    /**
     * 为一个品牌设置分类
     */
    const Category = req.models.category;
    const Brand = req.models.brand;
    const Response = req.Response;
    const brandId = req.params.brandId;
    const categoryIds = req.body.categories;
    if (isNaN(brandId) || !brandId || !(categoryIds instanceof Array) || categoryIds.some(function (id) { return !id || isNaN(id) })) {
        return res.send(new req.Response(-1, null, '参数错误'));
    }
    Brand.get(brandId, function (err, brand) {
        if (err) return res.send(new Response(-2, null, err));
        Category.find({ status: true }).where('id in (' + categoryIds.join(',') + ')').all(function (err, categories) {
            if (err) return res.send(new Response(-3, null, err));
            brand.setCategories(categories, function (err) {
                if (err) return res.send(new Response(-4, null, err));
                return res.send(new Response(0, null, 'success'));
            });
        });
    })
});

module.exports = router;