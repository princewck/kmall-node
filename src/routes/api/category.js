var express = require('express');
var router = express.Router();
var orm = require('orm');

router.route('/admin/categories')
    .get(function (req, res) {
        let Response = req.Response;
        let Category = req.models.category;
        let resp = new Response();
        Category.all(function (err, categories) {
            if (err) return resp.setCode(-1), res.send(resp);
            return resp.setData(categories), res.send(resp);
        });
    })
    .post(function (req, res) {
        let Response = req.Response;
        let Category = req.models.category;
        let categories = req.body.categories;
        if (!categories instanceof Array) return res.send(new Response(-1, null, '参数错误'));
        let hasInvalid = false;
        categories = categories.map(function (category) {
            if (!category.name) hasInvalid = true;
            return {
                name: category.name,
                description: category.description || null,
                sort: category.sort || 0,
                status: true
            }
        });
        if (hasInvalid) return res.send(new Response(-2, null, '参数不完整'));
        Category.create(categories, function (err) {
            if (err) return res.send(new req.Response(-3, null, err.message));
            return res.send(new req.Response(0, '创建成功'));
        });
    });

router.route('/web/categories')
    .get(function (req, res) {
        let Response = req.Response;
        let Category = req.models.category;
        let resp = new Response();
        Category.find({ status: true }, function (err, categories) {
            if (err) return resp.setCode(-1), res.send(resp);
            return resp.setData(categories), res.send(resp);
        });
    });


/**创建分类*/
router.post('/admin/category', function (req, res) {
    let Response = req.Response;
    let Category = req.models.category;
    let CategoryGroup = req.models.category_group;
    let params = req.body;
    var groupId = params.groupId;
    let category = {
        name: params.name || null,
        description: params.description || '',
        sort: params.sort || 0,
        status: true,
        image: params.image || ''
    }
    if (!category.name) return res.send(new Response(-1, null, '名称不可以为空'));
    Category.create(category, function (err, category) {
        if (err) return consle.log(err), res.send(new Response(-2, null, '新增分类失败！'));
        if (groupId) {
            CategoryGroup.get(groupId, function (err, group) {
                category.setCategoryGroups([group], function (err) {
                    if (err) {
                        return res.send(new Response(-3, null, err));
                    } else {
                        return res.send(new Response());
                    }
                });
            });
        } else {
            return res.send(new Response());
        }
    })
});

router.route('/admin/category/:categoryId')
    .get(function (req, res) {
        let Response = req.Response;
        let Category = req.models.category;
        let categoryId = req.params.categoryId;
        if (isNaN(categoryId)) return res.send(new Response(-1, null, '参数不合法'));
        Category.get(categoryId, function (err, cate) {
            if (err) return res.send(new Response(-2, null, err));
            return res.send(new Response(0, cate));
        })
    })
    .post(function (req, res) {
        let Response = req.Response;
        let Category = req.models.category;
        let categoryId = req.params.categoryId;
        let params = req.body;
        if (isNaN(categoryId)) return res.send(new Response(-1, null, '参数不合法,id未知定'));
        Category.get(categoryId, function (err, cate) {
            if (err) return res.send(err);
            for (k in cate) {
                if (params.hasOwnProperty(k)) {
                    cate[k] = params[k];
                }
            }
            cate.save(function (err) {
                if (err) return res.send(new Response(-2, err.message));
                return res.send(new Response(0, cate));
            });
        });

    });

router.post('/admin/category/:categoryId/del', function (req, res) {
    let Response = req.Response;
    let Category = req.models.category;
    if (isNaN(req.params.categoryId)) return res.send(new Response(-1, null, '参数缺失！'));
    Category.get(req.params.categoryId, function (err, cate) {
        if (err) return res.send(new Response(-2, null, err.message));
        cate.remove(function (err) {
            if (err) return res.send(new Response(-2, null, err.message));
            return res.send(new Response());
        });
    })
});

/**
 * 获取一级分类
 */
router.route(/^\/(admin||web)\/categoryGroups$/)
    .get(function (req, res) {
        let Response = req.Response;
        let CategoryGroup = req.models.category_group;
        CategoryGroup.find({ status: true }).all(function (err, categoryGroups) {
            if (err) return res.send(new Response(-1, null, err));
            else return res.send(new Response(0, categoryGroups, 'success!'));
        });
    })

/**
 * 获取banner上的一级分类
 */
router.route(/^\/(admin||web)\/categoryGroups\/onbanner$/)
    .get(function (req, res) {
        let Response = req.Response;
        let CategoryGroup = req.models.category_group;
        CategoryGroup.find({ status: true, on_banner: true }).all(function (err, categoryGroups) {
            if (err) return res.send(new Response(-1, null, err));
            return res.send(new Response(0, categoryGroups, 'success!'));
        });
    })

/**
 * 根据id 获取和更新一级分类
 */
function getGroup(req, res) {
    let Response = req.Response;
    let CategoryGroup = req.models.category_group;
    let groupId = req.params.id;
    if (!groupId || isNaN(groupId)) {
        return res.send(new Response(-1, null, '参数不合法'));
    }
    CategoryGroup.get(groupId, function (err, group) {
        if (err) return res.send(new Response(-2, null.err));
        return res.send(new Response(0, group));
    });
}

router.route('/web/categoryGroup/:id').get(getGroup);
router.route('/admin/categoryGroup/:id')
    .get(getGroup)
    .post(function (req, res) {
        let Response = req.Response;
        let CategoryGroup = req.models.category_group;
        let groupId = req.params.id;
        if (!groupId || isNaN(groupId)) {
            return res.send(new Response(-1, null, '参数错误'));
        }
        var group = {
            name: req.body.name,
            image: req.body.image,
            sort: req.body.sort,
            description: req.body.description,
            ceil_price: req.body.ceil_price,
            floor_price: req.body.floor_price,
            on_banner: req.body.on_banner,
            on_navbar: req.body.on_navbar,
            status: req.body.status,
            default_category: req.body.default_category
        }
        CategoryGroup.get(groupId, function (err, g) {
            if (err) return res.send(new Response(-2, null.err));
            for (k in group) {
                if (g.hasOwnProperty(k)) g[k] = group[k];
            }
            g.save(function (err) {
                if (err) return res.send(new Response(-2, null.err));
                return res.send(new Response());
            });
        });
    });

router.post('/admin/categoryGroup/:id/del', function (req, res) {
    let id = req.params.id;
    let Response = req.Response;
    let CategoryGroup = req.models.category_group;
    if (!id) return res.send(new Response(-1, null, 'id参数不合法'));
    CategoryGroup.get(id, function (err, group) {
        if (err) return res.send(new Response(-2, null, err));
        group.remove(function (err) {
            if (err) return res.send(new Response(-3, null, err));
            return res.send(new Response(0, null, 'success!'));
        });
    });

});

router.post('/admin/categoryGroup', function (req, res) {
    let Response = req.Response;
    let CategoryGroup = req.models.category_group;
    var group = {
        name: req.body.name,
        image: req.body.image,
        sort: req.body.sort,
        description: req.body.description,
        status: true,
        default_category: req.body.defaultCategory || null
    };
    if (!group.name) return res.send(new Response(-1, null, '一级分类名不能为空'));
    CategoryGroup.create(group, function (err, group) {
        if (err) return res.send(new Response(-2, null, err));
        return res.send(new Response(0, group, 'success!'));
    });
});

/**
 * 获取一级分类下的二级分类
 */
router.route('/admin/categoryGroup/:id/categories')
    .get(function (req, res) {
        let Response = req.Response;
        let CategoryGroup = req.models.category_group;
        let id = req.params.id;
        if (isNaN(id)) return res.send(new Response(-1, null, '参数错误'));
        console.log(CategoryGroup);
        CategoryGroup.get(id, function (err, group) {
            if (err) return res.send(new Response(-2, null, err));
            return res.send(new Response(0, group.categories));
        });
    })
    .post(function (req, res) {
        /**
         * 根据传入的id数组，为一级分类绑定二级分类
         */
        var categoryIds = req.body.categoryIds;
        var groupId = req.params.id;
        let Response = req.Response;
        let CategoryGroup = req.models.category_group;
        let Category = req.models.category;
        if (!categoryIds || isNaN(groupId) || !categoryIds instanceof Array || categoryIds.some(function (id) {
            return isNaN(id);
        })) {
            return res.send(new Response(-3, null, '参数不合法'));
        }
        CategoryGroup.get(groupId, function (err, group) {
            if (err) return res.send(new Response(-4, null, err));
            Category.find({ status: true }).where('id in (' + categoryIds.join(',') + ')').all(function (err, categories) {
                if (err) return res.send(new Response(-1, null, err));
                group.setCategories(categories, function (err, rt) {
                    if (err) return res.send(new Response(-5, null, err));
                    return res.send(new Response());
                });
            });
        });
    });

router.get('/web/categoryGroup/:id/categories', function (req, res) {
    let Response = req.Response;
    let CategoryGroup = req.models.category_group;
    let Category = req.models.category;
    let id = parseInt(req.params.id);
    if (isNaN(id)) return res.send(new Response(-1, null, '参数错误'));
    if (id) {
        CategoryGroup.get(id, function (err, group) {
            if (err) return res.send(new Response(-2, null, err));
            let categoryIds = group.categories.map(function (group) {
                return group.id;
            });
            Category.find({ id: categoryIds }, function (err, categories) {
                if (err) return res.send(new Response(-3, null, err));
                var result = {
                    group: group,
                    categories: categories
                }
                return res.send(new Response(0, result));
            });
        });
    } else {
        Category.find({ status: true }).all(function (err, categories) {
            if (err) return res.send(new Response(-4, null, err));
            var result = {
                group: null,
                categories: categories
            }
            return res.send(new Response(0, result));
        });
    }
})

router.post('/admin/categoryGroup/:id/categories/remove', function (req, res) {
    var categoryIds = req.body.categoryIds;
    var groupId = req.params.id;
    let Response = req.Response;
    let CategoryGroup = req.models.category_group;
    let Category = req.models.category;
    if (!categoryIds || isNaN(groupId) || !categoryIds instanceof Array || categoryIds.some(function (id) {
        return isNaN(id);
    })) {
        return res.send(new Response(-3, null, '参数不合法'));
    }
    CategoryGroup.get(groupId, function (err, group) {
        if (err) return res.send(new Response(-4, null, err));
        Category.find({ status: true }).where('id in (' + categoryIds.join(',') + ')').all(function (err, categories) {
            if (err) return res.send(new Response(-1, null, err));
            group.removeCategories(categories, function (err) {
                if (err) return res.send(new Response(-2, null, err));
                return res.send(new Response());
            });
        });
    });
});

router.post('/admin/category/:categoryId/categoryGroups', function (req, res) {
    /**
     * 根据传入的id数组，为一级分类绑定二级分类
     */
    var categoryGroupIds = req.body.categoryGroupIds;
    var categoryId = req.params.categoryId;
    let Response = req.Response;
    let CategoryGroup = req.models.category_group;
    let Category = req.models.category;

    if (!categoryGroupIds || isNaN(categoryId) || !categoryGroupIds instanceof Array || categoryGroupIds.some(function (id) {
        return isNaN(id);
    })) {
        return res.send(new Response(-3, null, '参数不合法'));
    }
    Category.get(categoryId, function (err, category) {
        if (err) return res.send(new Response(-1, null, err));
        CategoryGroup.find({ status: true }).where('id in (' + categoryGroupIds.join(',') + ')').all(function (err, groups) {
            if (err) return res.send(new Response(-2, null, err));
            category.setCategoryGroups(groups, function (err, rt) {
                if (err) return res.send(new Response(-3, null, err));
                return res.send(new Response());
            })
        });
    });
});


module.exports = router;