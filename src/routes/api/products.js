var express = require('express');
var router = express.Router();
var xlsx = require('node-xlsx');
var Pluploader = require('node-pluploader');
var path = require('path');
var multiparty = require('multiparty');
var orm = require('orm');
var pool = require('../../service/pool');
var moment = require('moment');

var productImportService = require('../../service/productImportService');
var xlsParser = productImportService.parseXLSDefault;
var xlsDailyParser = productImportService.parseXLSDaily;

router.route('/admin/products')
    .get(function (req, res) {
        let Products = req.models.product;
        let Response = req.Response;
        Products.find({ status: true }, function (err, products) {
            if (err) return res.send(new Response(-1, null, err.message));
            return res.send(new Response(0, products));
        });
    })
    .post(function (req, res) {
        let Products = req.models.product;
        let Response = req.Response;
        let params = req.body.products;
        if (!(params instanceof Array)) return res.send(new Response(-1, null, '参数不合法, 需要序列化的json对象, 键为products,值为数组'));
        let existInvalid = false;
        let products = params.map(function (p) {
            if (!p.name) existInvalid = true;
            return {
                cid: p.cid || null,
                brand_id: p.brand_id || null,
                product_id: p.product_id || null,
                product_name: p.product_name || '',
                product_image: p.product_image || null,
                product_detail_page: p.product_detail_page || null,
                shop_name: p.shop_name || null,
                price: p.price || 99999,
                monthly_sold: p.monthly_sold || 0,
                benefit_ratio: p.benefit_ratio || 0,
                seller_wangid: p.seller_wangid || null,
                short_share_url: p.short_share_url || null,
                share_url: p.share_url || null,
                share_command: p.share_command || null,
                total_amount: p.total_amount || null,
                left_amount: p.left_amount || null,
                coupon_text: p.coupon_text || null,
                coupon_start: p.coupon_start || new Date(),
                coupon_end: p.coupon_end || new Date(),
                coupon_link: p.coupon_link || null,
                coupon_command: p.coupon_command || null,
                coupon_short_url: p.coupon_short_url || null
            }
        });
        if (existInvalid) return res.send(new Response(-2, null, '参数错误，存在不合法的项'));
        Product.create(products, function (err, items) {
            if (err) return res.send(new Response(-2, null, err.message));
            return res.send(new Response(0, items));
        });
    });

//根据分类获取商品
router.get('/admin/category/:categoryId/products', function (req, res) {
    let Response = req.Response;
    let Category = req.models.category;
    let categoryId = req.params.categoryId;
    let Product = req.models.product;
    let query = {
        or: [
            { cid: category.id, coupon_price: null },
            { cid: category.id, coupon_price: orm.gt(0), coupon_end: orm.gt(new Date()) }
        ]
    };
    Category.get(categoryId, function (err, category) {
        if (err) return res.send(new Response(-1, null, err));
        Product.find({ cid: category.id }, function (err, products) {
            if (err) return res.send(new Response(-2, null, err));
            return res.send(new Response(0, products, 'success!'));
        })
    });
});

router.all('/admin/product/:productId', function (req, res, next) {
    let Response = req.Response;
    if (!Number(req.params.productId)) return res.send(new Response(-1, null, '缺少参数！'));
    next();
});

router.route('/admin/product/:productId')
    .get(function (req, res) {
        let Response = req.Response;
        let Product = req.models.product;
        Product.get(req.params.productId, function (err, product) {
            if (err) return res.send(new Response(-20, null, err.message));
            return res.send(new Response(0, product));
        });
    })
    .post(function (req, res) {
        let Response = req.Response;
        let Product = req.models.product;
        Product.get(req.params.productId, function (err, product) {
            if (err) return res.send(new Response(-1, onerror.message));
            for (k in product) {
                if (req.body.hasOwnProperty(k)) {
                    product[k] = req.body[k];
                }
            }
            product.save(function (err) {
                if (err) return res.send(new Response(-2, onerror.message));
                return res.send(new Response(0, product, '修改成功！'))
            });
        });
    });
router.get('/web/product/:productId', function (req, res) {
    let Response = req.Response;
    let Product = req.models.product;
    Product.get(req.params.productId, function (err, product) {
        if (err) return res.send(new Response(-20, null, err.message));
        return res.send(new Response(0, product));
    });
});

router.post('/admin/product/:productId/del', function (req, res) {
    let Response = req.Response;
    let Product = req.models.product;
    if (!Number(req.params.prouctId)) return res.send(new Response(-1, null, 'id不合法'));
    Product.get(req.params.prouctId, function (err, product) {
        if (err) return res.send(new Response(-1, null, err.message));
        product.remove(function (err) {
            if (err) return res.send(new Response(-3, null, err.message));
            return res.send(new Response());
        });
    });
});

//上传xlsx文件(with默认模板转换器)
router.post('/import/products/xlsx/default', function (req, res) {
    uploadXls(req, res, xlsParser, 1);
});
//上传xlsx文件(with每日精选模板转换器)
router.post('/import/products/xlsx/daily', function (req, res) {
    uploadXls(req, res, xlsDailyParser, 2);
});


router.get('/admin/xls/upload/history', function (req, res) {
    var History = req.models.upload_history;
    var Response = req.Response;
    History.all(function (err, history) {
        if (err) res.send(new Response(-1, null, err));
        else return res.send(new Response(0, history));
    });
});

router.get('/web/products/promotions/:page', function (req, res) {
    var Response = req.Response;
    var Product = req.models.product;
    var page = req.params.page;
    Product.count({ status: true, coupon_end: orm.gt(new Date()) }, function (err, total) {
        if (err) {
            return res.send(new Response(-1, null, err));
        } else {
            // return res.send(new Response(0, products));
            Product
                .find({ status: true, coupon_end: orm.gt(new Date()) })
                .orderRaw("ifnull(??, 0)/?? DESC", ['coupon_price', 'price'])
                .offset((page - 1) * 80).limit(80)
                .all(function (err, products) {
                    if (err) {
                        return res.send(new Response(-2, null, err));
                    } else {
                        var result = {
                            total: total,
                            pages: Math.ceil(total / 80),
                            currentPage: page,
                            data: products
                        }
                        return res.send(new Response(0, result));
                    }
                });
        }
    });
});

/**
 * 上传xls文件
 * @param {*} req 
 * @param {*} res 
 * @param {*} parser 
 * @param {*} historyType 
 */
function uploadXls(req, res, parser, source) {

    const response = new req.Response();
    const form = new multiparty.Form({
        autoFiles: true,
        maxFilesSize: '50m',
    });
    const UploadGroup = req.models.upload_category;
    console.time('upload_and_process_excel');
    console.time('convert xls to list');
    form.parse(req, (err, fields, files) => {
        if (err) {
            return res.send(err);
        }
        var cid = fields['cid'] && files['cid'].length ? fields['cid'][0] : null;
        var brand_id = fields['brand_id'] && fields['brand_id'].length ? fields['brand_id'][0] : null;
        var file = files.file[0];
        const workSheetsFromFile = xlsx.parse(file.path);
        const sheetItems = workSheetsFromFile[0].data;
        var productList = parser(sheetItems, cid, brand_id);
        console.timeEnd('convert xls to list');
        var uploadCategoryMap = {};
        var categoryGroupMap = {};
        if (!(productList instanceof Array) || !productList.length) {
            response.setCode(-1);
            response.setMessage('提交的数据不合法');
            return res.send(response);
        }
        let pikCid = product => {
            let uploadCname = product.uploadCategory;
            let group = null;
            if (uploadCategoryMap.hasOwnProperty(uploadCname)) {
                let upc = uploadCategoryMap[uploadCname];
                group = upc && upc['group'] ? categoryGroupMap[upc['group']['id']] : null;
            } else {
                if (~newUploadCategories.indexOf(uploadCname)) {
                    newUploadCategories.push(uploadCname);
                }
            }
            if (group) {
                group.categories = group.categories || [];
                let keywords = group.categories.reduce((kwds, item) => {
                    if (item.keywords) {
                        kwds.push.apply(kwds, item.keywords.split(',').map(k => {
                            return {
                                keyword: k,
                                category: item
                            };
                        }));
                    }
                    return kwds;
                }, []);
                let productName = product.product_name;
                let matchName = productName + '@' + uploadCname;
                let keywordsCountMap = {};
                keywords.forEach(item => {
                    var match = matchName.match(new RegExp(String(item.keyword), 'ig')) || [];
                    //fixit 这样子keywords不能重复
                    if (keywordsCountMap[item.keyword]) {
                        keywordsCountMap[item.keyword]['categoryIds'].push(item.category.id);
                        keywordsCountMap[item.keyword]['count'] += match.length;
                    } else {
                        keywordsCountMap[item.keyword] = { categoryIds: [item.category.id], count: match.length };
                    }
                });
                let cidMap = {};
                Object.keys(keywordsCountMap).forEach(key => {
                    let item = keywordsCountMap[key];
                    var categoryIds = item['categoryIds'];
                    var count = item['count'];
                    categoryIds.forEach(cid => {
                        if (cidMap[cid]) {
                            cidMap[cid] += count;
                        } else {
                            cidMap[cid] = count;
                        }
                    });
                });
                var countArraySorted = Object.keys(cidMap).sort(function (a, b) {
                    return Number(cidMap[b]) - Number(cidMap[a]);
                });
                var categoryId;
                if (countArraySorted.length) {
                    categoryId = countArraySorted[0];
                } else {
                    categoryId = group.default_category;
                }
                product.cid = categoryId || null;
                if (!product.cid) {
                    console.log('can\'t find a proper cid');
                }
                return categoryId;
            } else {
                console.log('找不到对应的group, 上传分类名称为：' + uploadCname);
                return null;
            }
        };         
        getUploadCategory(UploadGroup)
            .then(categories => {
                // upload category group map
                return uploadCategoryMap = categories
                    .reduce((map, item) => {
                        return map[item.name] = item, map;
                    }, {});
            })
            .then(() => {
                //category groups
                console.time('process_category_groups');
                let CategoryGroup = req.models.category_group;
                return getCategoryGroup(CategoryGroup);
            })
            .then(categoryGroups => {
                //categpry group map
                return categoryGroupMap = categoryGroups.reduce((map, item) => {
                    return map[item.id] = item, map;
                }, {});
            })
            .then(() => {
                console.timeEnd('process_category_groups');
                let newUploadCategories = [];
                let keyAry = [
                    { 'name': 'id', 'type': 'Number', map: 'product_id' },
                    { 'name': 'cid', 'type': 'Number' },
                    { 'name': 'brand_id', 'type': 'Number' },
                    { 'name': 'status', 'type': 'Boolean' },
                    { 'name': 'description', 'type': 'String' },
                    { 'name': 'creation_date', 'type': 'Date' },
                    { 'name': 'product_name', 'type': 'String' },
                    { 'name': 'product_image', 'type': 'String' },
                    { 'name': 'product_detail_page', 'type': 'String' },
                    { 'name': 'shop_name', 'type': 'String' },
                    { 'name': 'price', 'type': 'Number' },
                    { 'name': 'monthly_sold', 'type': 'Number' },
                    { 'name': 'benefit_ratio', 'type': 'Number' },
                    { 'name': 'benefit_amount', 'type': 'Number' },
                    { 'name': 'seller_wangid', 'type': 'String' },
                    { 'name': 'short_share_url', 'type': 'String' },
                    { 'name': 'share_url', 'type': 'String' },
                    { 'name': 'share_command', 'type': 'String' },
                    { 'name': 'coupon_total_amount', 'type': 'Number' },
                    { 'name': 'coupon_left_amount', 'type': 'Number' },
                    { 'name': 'coupon_text', 'type': 'String' },
                    { 'name': 'coupon_start', 'type': 'Date' },
                    { 'name': 'coupon_end', 'type': 'Date' },
                    { 'name': 'coupon_link', 'type': 'String' },
                    { 'name': 'coupon_command', 'type': 'String' },
                    { 'name': 'coupon_short_url', 'type': 'String' },
                    { 'name': 'coupon_price', 'type': 'Number' },
                    { 'name': 'platform', 'type': 'String' },
                    { 'name': 'real_price', 'type': 'Number' },
                    { 'name': 'small_images', 'type': 'String' }
                ];
                let preHandler = (item, product) => {
                    let rt = '';
                    switch (item.type) {
                        case 'Number':
                            rt = Number(product[item.map || item.name]) || 0;
                            break;
                        case 'Boolean':
                            rt = Boolean(product[item.map || item.name]);
                            break;
                        case 'Date':
                            var d = product[item.map || item.name];
                            rt = moment(product[item.map || item.name] || moment.now()).format('YYYY-MM-DD HH:mm:ss');
                            rt = '\'' + rt + '\'';
                            break;
                        case 'String':
                        default:
                            let str = product[item.map || item.name] ? String(product[item.map || item.name]).replace(/\'/g, '\\\'') : '';
                            rt = '\'' + str + '\'';
                    }
                    return rt;
                };

                let _valueFields = [];
                let _keyFields = keyAry.map(item => (item.name)).join(',');
                let _duplicateUpdateFields = keyAry.map(item => {
                    return ` ${item.name} = VALUES(${item.name}) `
                }).join(' , ');
                productList.forEach(product => {
                    if (brand_id) {
                        product.brand_id = brand_id;
                    }
                    if (!product.cid) {
                        (function (product) {
                            product.cid = pikCid(product);
                        })(product);
                    };
                    // 不能判断类别的商品剔除
                    if (!product.cid) return;
                    _valueFieldRow = keyAry
                        .map(item => {
                            return function (item, product) {
                                return preHandler(item, product);
                            }(item, product);
                        });
                    _valueFields.push('('+ _valueFieldRow +')');
                });
                let sql = `INSERT INTO product (${_keyFields}) VALUES ${_valueFields.join(',')} ON DUPLICATE KEY UPDATE ${_duplicateUpdateFields}`;

                let uploadCategoriesSql = newUploadCategories.length ? `INSERT INTO upload_category (name) VALUES ${
                    newUploadCategories
                        .filter(c => c)
                        .map(c => {
                            return '(' + c + ')';
                        })
                        .join(',')
                    }` : null;
                return { sql, uploadCategoriesSql };
            })
            .then(({ sql, uploadCategoriesSql }) => {
                //插入数据，和新增的upload categories
                console.time('execute_sqls');
                return Promise.all([exexQuery(uploadCategoriesSql), exexQuery(sql)]);
            })
            .then(results => {
                console.timeEnd('execute_sqls');
                console.timeEnd('upload_and_process_excel');
                res.send(results);
            })
            .catch(err => {
                console.log(err);
                res.send(err);
            });

    });

}

function exexQuery(sql) {
    return new Promise((resolve, reject) => {
        if (!sql) return resolve({
            results: {
                message: 'nothing to insert, abort query'
            }
        });
        pool.getConnection((err, connection) => {
            connection.query(sql, (err, results, fields) => {
                if (err) return reject(err);
                resolve({
                    results, fields
                });
            });
        });
    });
}

function getUploadCategory(uploadGroupModel) {
    return new Promise(function (resolve, reject) {
        //获取上传分类列表
        uploadGroupModel.all(function (err, uploadCategories) {
            if (err) {
                reject();
            } else {
                resolve(uploadCategories);
            }
        });
    });
}

function getCategoryGroup(CategoryGroup) {
    return new Promise(function (resolve, reject) {
        CategoryGroup.all(function (err, groups) {
            if (err) {
                reject(err);
            } else {
                resolve(groups);
            }
        });
    });
}


router.get('/web/brand/:brandId/products', function (req, res) {
    let Response = req.Response;
    let Product = req.models.product;
    let brandId = req.params.brandId;
    Product.find({ brand_id: brandId, status: true }, function (err, products) {
        if (err) return res.send(new Response(-1, null, err));
        return res.send(new Response(0, products));
    });
});

router.get('/web/brand/:brandId/products/p/:pageId', function (req, res) {
    let Response = req.Response;
    let Product = req.models.product;
    let brandId = req.params.brandId;
    let pageid = req.params.pageId;
    var query = {
        or: [
            { brand_id: brandId, status: true, coupon_price: null },
            { brand_id: brandId, status: true, coupon_price: orm.gt(0), coupon_end: orm.gt(new Date()) }
        ]
    }
    Product.pages(query, function (err, pages) {
        Product.count(query, function (err, count) {
            Product.page(query, pageid).run(function (err, products) {
                var result = {
                    total: count,
                    currentPage: pageid,
                    pages: pages,
                    data: products
                };
                res.send(new Response(0, result));
            });
        });
    });
});

router.post('/web/products/query/p/:pageId', function (req, res) {
    var hasCoupon = req.body.hasCoupon;//搜素红包时用这个
    var groupId = req.body.groupId;
    var keyword = req.body.kwd;
    var brandIds = req.body.brandIds instanceof Array ? req.body.brandIds : null;
    var categoryIds = req.body.categoryIds instanceof Array ? req.body.categoryIds : [];
    var Product = req.models.product;
    var CategoryGroup = req.models.category_group;
    var query = {};
    var Response = req.Response;
    var pageId = req.params.pageId || 1;
    brandIds && (brandIds = brandIds.filter(function (brandId) {
        return Number(brandId) > 0;
    }));
    categoryIds && (categoryIds = categoryIds.filter(function (categoryId) {
        return Number(categoryId) > 0;
    }));
    //获取可用的二级分类ID
    var availableCategories = null;
    var ceilPrice = null;
    var floorPrice = null;
    if (brandIds && brandIds.length) query.brand_id = brandIds;
    if (Number(groupId) > 0) {
        CategoryGroup.get(groupId, function (err, categoryGroup) {
            if (err) {
                availableCategories = [];//查不到记录
                doQuery(query);
            } else {
                ceilPrice = categoryGroup.ceil_price;
                floorPrice = categoryGroup.floor_price;
                availableCategories = categoryGroup.categories.map(function (c) {
                    return c.id;
                });
                doQuery(query, floorPrice, ceilPrice);
            }
        });
    } else {
        doQuery(query);
    }

    function doQuery(query, floorPrice, ceilPrice) {
        var queryCategories = null;
        if (categoryIds && categoryIds.length && availableCategories) {
            queryCategories = categoryIds.filter(function (id) {
                return availableCategories.indexOf(Number(id)) >= 0;
            });
        } else if (categoryIds.length && !availableCategories) {
            //未指定一级分类
            queryCategories = categoryIds;
        } else if ((!categoryIds || !categoryIds.length) && availableCategories) {
            //未指定二级分类
            queryCategories = availableCategories;
        } else {
            //全没指定
        }
        if (floorPrice > 0) {
            query.real_price = orm.gte(floorPrice);
        }
        if (ceilPrice > 0) {
            query.real_price = orm.between(0, ceilPrice);
        }
        if (hasCoupon) {
            query.coupon_total_amount = orm.gt(0);
            query.coupon_end = orm.gt(new Date());
        }
        if (queryCategories) query.cid = queryCategories;
        if (keyword) {
            query.product_name = orm.like('%' + keyword + '%');
        }
        let _query = {};
        _query.or = [
            Object.assign({ coupon_price: orm.gt(0), coupon_end: orm.gt(new Date()) }, query),
            Object.assign({ coupon_price: null }, query)
        ];
        // if (!keyword) {
        Product.count(_query, function (err, count) {
            Product.pages(_query, function (err, pages) {
                Product.page(_query, pageId).run(function (err, products) {
                    var result = {
                        total: count,
                        currentPage: pageId,
                        pages: pages,
                        data: products
                    };
                    return res.send(new Response(0, result, 'success'));
                });
            });
        });
    }
});

module.exports = router;