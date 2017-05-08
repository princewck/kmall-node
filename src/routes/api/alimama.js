var express = require('express');
var router = express.Router();
var config = require('../../.config');
TopClient = require('../../libs/alimama/lib/api/topClient').TopClient;
var client = new TopClient(config.alimamaConfig);

router.post('/web/query', function (req, res) {
    var Response = req.Response;
    getProducts().then(function (response) {
        res.send(new Response(0, response));
    }).catch(function (err) {
        console.error(err);
        res.send(err);
    });
});


router.get('/web/product/:id/relevant', function (req, res) {
    var Response = req.Response;
    var id = req.params.id;
    if (!id) return res.send(new Response(-1, null, 'id不合法'));
    getRelevantProducts(id, 40).then(function (products) {
        res.send(new Response(0, products));
    }).catch(function (err) {
        return res.send(new Response(-2, null, err));
    });
});

router.get('/web/xpks', function (req, res) {
    var Response = req.Response;
    getProductRepositoryList('300', '1').then(function (list) {
        res.send(new Response(0, list));
    }).catch(function (err) {
        res.send(new Response(-1, null, err));
    });
});


router.get('/web/xpks/:id/products', function (req, res) {
    var Response = req.Response;
    var id = req.params.id;
    getProductsByRepository(id).then(function (response) {
        res.send(new Response(0, response));
    }).catch(function (err) {
        res.send(new Response(-1, null, err));
    });
});


router.post('/web/convert', function (req, res) {
    var Response = req.Response;
    var url = req.body.url;
    console.log(url);
    urlConverter(url).then(function (response) {
        res.send(new Response(0, response));
    }).catch(function (err) {
        res.send(new Response(-1, null, err));
    });
});

router.post('/web/tbk/coupons', function (req, res) {
    var Response = req.Response;
    var q = req.body.query;
    if (!q) return res.send(new Response(-1, null, '参数错误'));
    couponSearch(q).then(function (coupons) {
        return res.send(new Response(0, coupons));
    }).catch(function (err) {
        return res.send(new Response(-2, null, err));
    });
});

router.get('/web/product/:id/detail', function (req, res) {
    if (!req.params.id || !Number(req.params.id)) {
        return res.send(new req.Response(-1, null, 'id not valid'));
    } else {
        getProductDetail(req.params.id).then(function (result) {
            res.send(new req.Response(0, result));
        });
    }
});

function getProductDetail(id) {
    return new Promise(function (resolve, reject) {
        client.execute('taobao.tbk.item.info.get', {
            'fields': 'num_iid,title,pict_url,small_images,reserve_price,zk_final_price,user_type,provcity,item_url',
            'platform': '1',
            'num_iids': id
        }, function (error, response) {
            if (!error) {
                resolve(response);
            }
            else {
                reject(error);
                console.log(error);
            }
        })
    });
}


/**
 * 获取商品列表
 * 没有包含淘宝客链接
 */
function getProducts(q, is_tmall, start_price, end_price, page_size, page_no) {
    return new Promise(function (resolve, reject) {
        // client.execute('taobao.tbk.item.get', {
        client.execute('taobao.taobaoke.items.detail.get', {
            'fields': 'num_iid,title,pict_url,small_images,reserve_price,zk_final_price,user_type,provcity,item_url,seller_id,volume,nick,click_url',
            'q': '女装',
            // 'cat':'16,18',
            // 'itemloc':'杭州',
            'sort': 'tk_rate_des',
            // 'is_tmall': String(is_tmall) || 'true',
            'is_overseas': 'false',
            'start_price': '0',
            'end_price': '10000',
            // 'start_tk_rate':'0500',
            // 'end_tk_rate':'9999',
            'platform': '1',
            'page_no': '1',
            'page_size': '50'
        }, function (error, response) {
            if (!error) resolve(response);
            else {
                console.log(error);
                reject(error);
            }
        });
    });
}

/**
 * 根据num_iid获取相关商品
 */
function getRelevantProducts(num_iid, count) {
    return new Promise(function (resolve, reject) {
        client.execute('taobao.tbk.item.recommend.get', {
            'fields': 'num_iid,title,pict_url,small_images,reserve_price,zk_final_price,user_type,provcity,item_url',
            'num_iid': String(num_iid),
            'count': isNaN(count) ? '20' : String(count),
            'platform': '1'
        }, function (error, response) {
            if (!error) resolve(response);
            else reject(error);
        });
    });
}

/**
 * 获取选品库列表
 */
function getProductRepositoryList(page_size, page_no) {
    return new Promise(function (resolve, reject) {
        client.execute('taobao.tbk.uatm.favorites.get', {
            'page_no': '1',
            'page_size': '20',
            'fields': 'favorites_title,favorites_id,type',
            'type': '-1'
        }, function (error, response) {
            if (!error) resolve(response);
            else reject(error);
        });
    });
}

/**
 * 获取选品库中的明细
 * @param {*} favoritesId 
 * @param {*} pageSize 
 * @param {*} pageNo 
 */
function getProductsByRepository(favoritesId, pageSize, pageNo) {
    return new Promise(function (resolve, reject) {
        client.execute('taobao.tbk.uatm.favorites.item.get', {
            'platform': '1',//1：PC，2：无线
            'page_size': isNaN(pageSize) ? '20' : String(pageSize),
            'adzone_id': '77624711',
            'unid': '3456',
            'favorites_id': String(favoritesId),
            'page_no': isNaN(pageNo) ? '1' : String(pageNo),
            'fields': 'click_url,num_iid,title,pict_url,small_images,reserve_price,zk_final_price,user_type,provcity,item_url,seller_id,volume,nick,shop_title,zk_final_price_wap,event_start_time,event_end_time,tk_rate,status,type'
        }, function (error, response) {
            if (!error) resolve(response);
            else reject(error);
        });
    });
}

/**
 * 普通链接转换成推广链接
 * @param {string} url 
 * tofix 参数结构未知
 */
function urlConverter(url) {
    return new Promise(function (resolve, reject) {
        client.execute('taobao.tbk.spread.get', {
            'requests': [url]
        }, function (error, response) {
            if (!error) resolve(response);
            else reject(error);
        });
    });
}

function couponSearch(q, pageSize, pageNo) {
    return new Promise(function (resolve, reject) {
        client.execute('taobao.tbk.item.coupon.get', {
            'platform': '1',//1：PC，2：无线，默认：1
            // 'cat':'16,18',
            'page_size': isNaN(pageSize) ? '30' : String(pageSize),
            'q': q,
            'page_no': isNaN(pageNo) ? '1' : String(pageNo),
            'pid': 'mm_28737704_8828629_77624711'
        }, function (error, response) {
            if (!error) resolve(response);
            else reject(error);
        });
    });
}

module.exports = router;