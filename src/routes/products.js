var express = require('express');
var router = express.Router();
var xlsx = require('node-xlsx');
var Pluploader = require('node-pluploader');
var path = require('path');
var multiparty = require('multiparty');

var productImportService = require('../service/productImportService');
var xlsParser = productImportService.parseXLS;

router.route('/admin/products')
    .get(function(req, res) {
        let Products = req.models.product;
        let Response = req.Response;
        Products.find({status: true}, function(err, products) {
            if (err) return res.send(new Response(-1, null, err.message));
            return res.send(new Response(0, products));
        });
    })
    .post(function(req, res) {
        let Products = req.models.product;
        let Response = req.Response;
        let params = req.body.products;
        if (!(params instanceof Array)) return res.send(new Response(-1, null, '参数不合法, 需要序列化的json对象, 键为products,值为数组'));
        let existInvalid = false;
        let products = params.map(function(p) {
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
        Product.create(products, function(err, items) {
            if (err) return res.send(new Response(-2, null, err.message));
            return res.send(new Response(0, items));
        });
    });

//根据分类获取商品
router.get('/admin/category/:categoryId/products', function(req, res) {
    let Response = req.Response;
    let Category = req.models.category;
    let categoryId = req.params.categoryId;
    let Product = req.models.product;
    Category.get(categoryId, function(err, category) {
        if (err) return res.send(new Response(-1, null, err));
        Product.find({cid: category.id}, function(err, products) {
            if (err) return res.send(new Response(-2, null, err));
            return res.send(new Response(0, products, 'success!'));
        })
    });
});

router.all('/admin/product/:productId', function(req, res, next) {
    let Response = req.Response;
    if (!Number(req.params.productId)) return res.send(new Response(-1, null, '缺少参数！'));
    next();
});

router.route('/admin/product/:productId')
    .get(function(req, res) {
        let Response = req.Response;
        let Product = req.models.product;
        Product.get(req.params.productId, function(err, product) {
            if (err) return res.send(new Response(-20, null, err.message));
            return res.send(new Response(0, product));
        });
    })
    .post(function(req, res) {
        let Response = req.Response;
        let Product = req.models.product; 
        Product.get(req.params.productId, function(err, product) {
            if (err) return res.send(new Response(-1, onerror.message));
            for (k in product) {
                if (req.body.hasOwnProperty(k)) {
                    product[k] = req.body[k];
                } 
            }
            product.save(function(err) {
                if (err) return res.send(new Response(-2, onerror.message));
                return res.send(new Response(0, product, '修改成功！'))
            });
        });
    });

router.post('/admin/product/:productId/del', function(req, res) {
    let Response = req.Response;
    let Product = req.models.product;
    if (!Number(req.params.prouctId)) return res.send(new Response(-1, null, 'id不合法'));
    Product.get(req.params.prouctId, function(err, product) {
        if (err) return res.send(new Response(-1, null, err.message));
        product.remove(function(err) {
            if (err) return res.send(new Response(-3, null, err.message));
            return res.send(new Response());
        });
    });
});

//上传xlsx文件
router.post('/import/products/xlsx', function(req, res) {
    var form = new multiparty.Form();
    var Product = req.models.product;
    form.parse(req, function(err, fields, files) {
        if (files.file.length) {
            var cid = fields['cid'] && fields['cid'].length ? fields['cid'][0] : 0;
            var brand_id = fields['brand_id'] && fields['brand_id'].length ? fields['brand_id'][0] : 0;
            var file = files.file[0];
            if (!cid) return res.send(new req.Response(-2, null, '分类没有指定'));
            const workSheetsFromFile = xlsx.parse(file.path);
            var sheetItems = workSheetsFromFile[0].data;
            var productList = (xlsParser(sheetItems, cid, brand_id));
            productList.shift();//去除第一行表头
            Product.create(productList, function(err, items) {
                if (err) return res.send(new req.Response(-3, null, err.message));
                return res.send(new req.Response(0, items));
            });
        } else {
            return res.send(new req.Response(-1, null, '文件有误'));
        }
    });
});

module.exports = router;