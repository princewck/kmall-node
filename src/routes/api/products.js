var express = require('express');
var router = express.Router();
var xlsx = require('node-xlsx');
var Pluploader = require('node-pluploader');
var path = require('path');
var multiparty = require('multiparty');
var orm = require('orm');

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
    let query = {or: [
        {cid: category.id, coupon_price: null},
        {cid: category.id, coupon_price: orm.gt(0), coupon_end: orm.gt(new Date())}
    ]};
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

function uploadXls(req, res, parser, historyType) {
    var form = new multiparty.Form({
        autoFiles: true,
        maxFilesSize: '50m'
    });
    var Product = req.models.product;
    var History = req.models.upload_history;
    var UploadGroup = req.models.upload_category;
    var CategoryGroup = req.models.category_group;
    form.parse(req, function (err, fields, files) {
        if (files.file.length) {
            var cid = fields['cid'] && fields['cid'].length ? fields['cid'][0] : 0;
            var brand_id = fields['brand_id'] && fields['brand_id'].length ? fields['brand_id'][0] : 0;
            var file = files.file[0];
            if (!cid && historyType === 1) return res.send(new req.Response(-2, null, '分类没有指定'));
            const workSheetsFromFile = xlsx.parse(file.path);
            var sheetItems = workSheetsFromFile[0].data;
            var productList = parser(sheetItems, cid, brand_id);
            productList.shift();//去除第一行表头
            var uploadCategoryGroupMap = {};
            var categoryGroupMap = {};
            Promise.all([getUploadCategory(UploadGroup), getCategoryGroup(CategoryGroup)])
                .then(function ([uploadCategories, categoryGroups]) {
                    uploadCategories.forEach(function (uploadCategory) {
                        //根据上传表格中的一级分类名字映射到数据库中的上传分类
                        uploadCategoryGroupMap[uploadCategory.name] = uploadCategory;
                    });
                    categoryGroups.forEach(function (categoryGroup) {
                        categoryGroupMap[categoryGroup.id] = categoryGroup;
                    });
                    History.create({
                        start: new Date(),
                        cid: historyType === 2 ? null : cid,
                        brand_id: brand_id,
                        type: historyType
                    }, function (err, record) {
                        err && console.log(err);
                        if (!err) {
                            res.send(new req.Response(0, record.id, '数据接收成功，稍后查看请求结果'));
                            var count = 0;
                            var duplicateCount = 0;
                            var errCount = 0;
                            var promises = productList.map(function (product) {
                                return new Promise(function (resolve, reject) {
                                    if (historyType === 2) {
                                        //获取一级分类,并匹配二级分类
                                        var uploadCategory = product.uploadCategory;//String
                                        console.log('---开始-分类=' + uploadCategory + '-------------------')
                                        if (!uploadCategoryGroupMap.hasOwnProperty(uploadCategory)) {
                                            console.log('~~分类' + uploadCategory + '不存在，开始创建...');
                                            //新建一个上传分类
                                            uploadCategoryGroupMap[uploadCategory] = { name: uploadCategory };
                                            UploadGroup.create({ name: uploadCategory }, function (err, uploadCategory) {
                                                if (!err) {
                                                    console.log('~~~~分类' + uploadCategory + '创建成功！！！...');
                                                    return;
                                                }
                                                else console.log('~~~~分类' + uploadCategory + '创建失败@@@！！！...');
                                            });
                                            return;
                                        } else {
                                            console.log('~~分类' + uploadCategory + '存在，开始设置上传二级分类..');
                                            if (!uploadCategoryGroupMap[uploadCategory] || !uploadCategoryGroupMap[uploadCategory].group || !uploadCategoryGroupMap[uploadCategory].group.id) {
                                                return;
                                            }
                                            var groupId = uploadCategoryGroupMap[uploadCategory]['group']['id'];
                                            var _group = categoryGroupMap[groupId];
                                            var categoryKeywords = [];
                                            var defaultCategoryId = _group.default_category;
                                            _group.categories.forEach(function (c) {
                                                if (c && c.keywords) {
                                                    c.keywords.split(',').forEach(function (keyword) {
                                                        if (keyword) {
                                                            categoryKeywords.push({ keyword: keyword, category: c });
                                                        }
                                                    });
                                                }
                                            });
                                            var productName = product.product_name;
                                            var matchName = productName + '@' + uploadCategory;
                                            var countMap = {};
                                            // console.log(JSON.stringify(categoryKeywords));
                                            categoryKeywords.forEach(function (word) {
                                                var match = matchName.match(new RegExp(String(word.keyword), 'ig')) || [];
                                                countMap[word.keyword] = { categoryId: word.category.id, count: match.length };
                                            });

                                            var cateCountMap = {};
                                            Object.keys(countMap).forEach(function (key) {
                                                var categoryId = countMap[key]['categoryId'];
                                                var count = countMap[key]['count'];
                                                if (cateCountMap[categoryId]) {
                                                    cateCountMap[categoryId] += count;
                                                } else {
                                                    cateCountMap[categoryId] = count;
                                                }
                                            });
                                            console.log('~~~~~~~~~~~~~~~~~~~~~分类匹配结果：分类id->次数', cateCountMap);
                                            var countArraySorted = Object.keys(cateCountMap).sort(function (a, b) {
                                                return Number(cateCountMap[b]) - Number(cateCountMap[a]);
                                            });
                                            var categoryId;
                                            if (countArraySorted.length) {
                                                categoryId = countArraySorted[0];
                                                console.log('~~~~~~~~~~~~~~~~~~~~~~~~根据匹配次数，确定id为' + categoryId);
                                            } else {
                                                console.log('~~~~~~~~~~~~~~~~~~~~~~~~根据匹配次数，确定id使用默认id:' + defaultCategoryId);
                                                categoryId = defaultCategoryId;
                                            }
                                            // var categoryId = countArraySorted.length ? countArraySorted[0]['categoryId'] : defaultCategoryId;//默认分类

                                            product.cid = categoryId;
                                        }
                                    }

                                    if (product.cid) {
                                        Product.create(product, function (err) {
                                            if (err) {
                                                /**更新重复数据 */
                                                if (err.code == 'ER_DUP_ENTRY') {
                                                    duplicateCount++;
                                                    Product.get(product.product_id, function (err, p) {
                                                        if (!err) {
                                                            for (k in p) {
                                                                if (product[k] && k != 'product_id') {
                                                                    p[k] = product[k];
                                                                }
                                                            }
                                                            p.save(function (err) {
                                                                if (!err) {
                                                                    count++;
                                                                    resolve();
                                                                } else {
                                                                    console.log('更新重复产品失败', err);
                                                                    errCount++;
                                                                    resolve();
                                                                }
                                                            });
                                                        } else {
                                                            console.log('获取重复产品但是失败', err);
                                                            errCount++;
                                                            resolve();
                                                        }
                                                    })
                                                } else {
                                                    console.log(err);
                                                }
                                            } else {
                                                count++;
                                                resolve();
                                            }
                                        });
                                    } else {
                                        resolve();
                                        console.log('全部操作完成');
                                    }

                                });
                            });
                            Promise.all(promises).then(function () {
                                record.count = count;
                                record.duplicate_count = duplicateCount;
                                record.err_count = errCount;
                                record.end = new Date();
                                record.done = true;
                                record.save(function (err) {
                                    if (err) console.log('上传记录更新失败', err);
                                });
                            });
                        }
                    });

                });
        } else {
            return res.send(new req.Response(-1, null, '文件有误'));
        }
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
    var query = {or: [
        { brand_id: brandId, status: true , coupon_price: null},
        { brand_id: brandId, status: true , coupon_price: orm.gt(0), coupon_end: orm.gt(new Date())}
    ]}
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
            Object.assign({coupon_price: orm.gt(0), coupon_end: orm.gt(new Date())}, query),
            Object.assign({coupon_price: null}, query)
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