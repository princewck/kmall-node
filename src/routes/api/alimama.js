var express = require('express');
var router = express.Router();
var config = require('../../.config');
var mysql = require('mysql');
var moment = require('moment');
TopClient = require('../../libs/alimama/lib/api/topClient').TopClient;
var client = new TopClient(config.alimamaConfig);
var adzone_id = '92230524';

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

router.get('/admin/xpks', function (req, res) {
    var Response = req.Response;
    getProductRepositoryList('200', '1').then(function (list) {
        res.send(new Response(0, list));
    }).catch(function (err) {
        res.send(new Response(-1, null, err));
    });
});


router.get('/web/xpk/:id/products', function (req, res) {
    var Response = req.Response;
    var id = req.params.id;
    getProductsByRepository(id, 300, 1).then(function (response) {
        res.send(new Response(0, response));
    }).catch(function (err) {
        res.send(new Response(-1, null, err));
    });
});

/**
 * 根据选品库名字更新数据库
 */
router.post('/admin/xpk/:name/:cid/update', function (req, res) {
    var cid = req.params.cid;
    var name = String(req.params.name);
    var Response = req.Response;
    var Category = req.models.category;
    name = name.replace(/：/g, ':');
    if (!name || !cid) return res.send(new Response(-1, null, '参数不合法'));
    getProductRepositoryList('200', '1').then((list) => {
        try {
            var list = list.results.tbk_favorites.filter((xpk) => {
                var title = xpk.favorites_title.replace(/：/g, ':');
                return new RegExp('^' + name, 'ig').test(title);
            });
            console.log('选品库列表：', list);
        } catch (e) {
            console.error(e);
        }
        // return res.send(list);
        var favorites_ids = list.map((fa) => ({ id: fa.favorites_id, name: fa.favorites_title }));
        if (!favorites_ids.length) return res.send(new Response(-6, null, '没有对应的选品库'));
        update(favorites_ids, 1);
        var _fields = [];
        function update(ids, page, _fa) {
            var callee = arguments.callee;
            var fa;
            if (page == 2) {
                fa = _fa;
            } else {
                fa = favorites_ids.shift();
            }
            var id = fa['id'];
            var faName = fa['name'];
            console.log('同步' + faName + '...');
            console.log('fa_id:', id);
            getProductsByRepository(id, 100, page).then(function (result) {
                try {
                    var total_results = result.total_results;
                    var items = result.results.uatm_tbk_item;
                    console.log(items.length);
                    var itemsSql = items.filter((item) => (item.tk_rate > 0)).map((item) => {
                        var p = {
                            product_id: item.num_iid,
                            cid: cid,
                            brand_id: null,
                            status: item.status,
                            description: '来自选品库同步商品',
                            creation_date: moment().format('YYYY-MM-DD HH:mm:ss'),
                            product_name: item.title,
                            product_image: item.pict_url,
                            product_detail_page: item.item_url,
                            shop_name: item.shop_title,
                            price: item.zk_final_price,
                            monthly_sold: item.volume,
                            benefit_ratio: item.tk_rate,
                            benefit_amount: ((Number(item.tk_rate) || 0) * item.zk_final_price / 100), //佣金
                            seller_wangid: item.seller_id,
                            short_share_url: item.click_url || item.item_url,
                            share_url: item.click_url || item.item_url,
                            share_command: null,

                            coupon_total_amount: item.coupon_total_count || 0,
                            coupon_left_amount: item.coupon_remain_count || 0,
                            coupon_text: item.coupon_info || '',
                            coupon_start: item.coupon_start_time || '2000-01-01',
                            coupon_end: item.coupon_end_time || '2000-01-01',
                            coupon_link: item.coupon_click_url || null,
                            coupon_command: null,
                            coupon_short_url: item.coupon_click_url || null,
                            coupon_price: getCouponPrice(String(item.coupon_info)),
                            platform: null,
                            real_price: item.zk_final_price - getCouponPrice(String(item.coupon_info)),
                            small_images: JSON.stringify(item.small_images)
                        }
                        Object.keys(p).forEach(function (key) {
                            if (p[key] && typeof (p[key]) === 'string') {
                                p[key] = p[key].replace(/\'/g, '\\\'');
                            };
                        });
                        return `(${p.product_id},${p.cid},${p.status},'${p.description}','${p.creation_date}','${p.product_name}','${p.product_image}','${p.product_detail_page}','${p.shop_name}',${p.price},${p.monthly_sold},${p.benefit_ratio},${p.benefit_amount},'${p.seller_wangid}','${p.short_share_url}','${p.share_url}',${p.coupon_total_amount},${p.coupon_left_amount},'${p.coupon_text}','${p.coupon_start}','${p.coupon_end}','${p.coupon_link}','${p.coupon_short_url}',${p.coupon_price},${p.real_price},'${p.small_images}')`;
                    }).join(',');
                    var sql = `insert into product (id, cid, status, description, creation_date, product_name, product_image, product_detail_page, shop_name,price,monthly_sold, benefit_ratio, benefit_amount, seller_wangid, short_share_url, share_url, coupon_total_amount, coupon_left_amount,coupon_text,coupon_start, coupon_end, coupon_link, coupon_short_url, coupon_price, real_price, small_images) values ` + itemsSql + ` on duplicate key update status = values(status), cid = values(cid),price = values(price),monthly_sold = values(monthly_sold),benefit_ratio = values(benefit_ratio),benefit_amount = values(benefit_amount),coupon_left_amount = values(coupon_left_amount);`;
                    var pool = mysql.createPool(config.mysqlPoolConfig);
                    pool.getConnection(function (err, connection) {
                        if (err) return console.log(err), res.send(new Response(-10, err, '数据库连接出错'));
                        connection.query(sql, function (error, results, fields) {
                            // And done with the connection.
                            connection.release();
                            console.log('同步' + faName + ' 成功！！！更新了' + items.length + '条数据。');
                            if (error) return res.send(new Response(-5, sql, error));
                            results.faName = faName;
                            results.page = '第' + page + '页';
                            _fields.push(results);
                            if (page == 1 && total_results > 100) {
                                setTimeout(function () {
                                    console.log('开始请求id:' + id + '的第2页');
                                    callee(ids, 2, fa);
                                }, 800);
                            } else if (ids.length) {
                                setTimeout(function () {
                                    console.log('开始请求id:' + id + '的第1页');
                                    callee(ids, 1);
                                }, 800);
                            } else {
                                Category.get(cid, (err, category) => {
                                    if (err) res.send(new Response(-8, null, '内部错误'));
                                    category.xpk_last_update = new Date();
                                    category.save(function (err, category) {
                                        if (err) return res.send(-9, null, '内部错误');
                                        else return res.send(new Response(0, _fields, '全部更新成功'));
                                    });
                                });
                            }
                            // Don't use the connection here, it has been returned to the pool.
                        });
                    });
                } catch (e) {
                    throw new Error(e);
                }
            }).catch((e) => {
                console.error(e);
                res.send(new Response(-2, null, e));
            });
        }
    });
});

router.get('/tbk/orders', function (req, res) {
    getOrders().then(res => {
        res.send(res);
    }).catch((e) => res.send(e));
});

function getCouponPrice(couponExpression) {
    var p = /\d{1,}/g;
    var arr = couponExpression.match(p);
    arr = arr || [0];
    var couponPrice = Math.min.apply(Math, arr);
    return couponPrice || 0;
}


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

/**
 * 好券清单
 */
router.get('/web/nice_coupons/:kw/:page', (req, res) => {
    niceCouponList(req.params.kw, req.params.page)
        .then((list) => {
            res.send(list);
        })
        .catch(() => {
            res.send('error');
        });
});
router.get('/web/hot_goods/:start/:page', (req, res) => {
    hotList(req.params.start, req.params.page)
        .then((list) => {
            res.send(list);
        })
        .catch((err) => {
            res.send(err);
        });
});

//无权限
// router.get('/web/tbk/categories/:parent_id/:cid', function (req, res) {
//     categories(req.params.parent_id, req.params.cid)
//         .then(list => {
//             res.send(list);
//         })
//         .catch(err => {
//             res.send(err);
//         });
// });


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
            'page_size': page_size,
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
            'page_size': isNaN(pageSize) ? '200' : String(pageSize),
            'adzone_id': adzone_id,
            'unid': '3456',
            'favorites_id': String(favoritesId),
            'page_no': isNaN(pageNo) ? '1' : String(pageNo),
            'fields': 'click_url,num_iid,title,pict_url,small_images,reserve_price,category,zk_final_price,user_type,provcity,item_url,seller_id,volume,nick,shop_title,zk_final_price_wap,event_start_time,event_end_time,tk_rate,commission_rate,status,type,coupon_click_url,coupon_info,coupon_start_time,coupon_end_time,coupon_total_count,coupon_remain_count,commission_rate'
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

function getOrders() {
    return new Promise((resolve, reject) => {
        client.execute('taobao.tbk.order.get', {
            'fields': 'tb_trade_parent_id,tb_trade_id,num_iid,item_title,item_num,price,pay_price,seller_nick,seller_shop_title,commission,commission_rate,unid,create_time,earning_time,tk3rd_pub_id,tk3rd_site_id,tk3rd_adzone_id',
            'start_time': '2016-05-23 12:18:22',
            'span': '600',
            'page_no': '1',
            'page_size': '100',
            'tk_status': '1',
            'order_query_type': 'create_time'
        }, function (error, response) {
            if (!error) {
                console.log(response);
                resolve(response);
            }
            else {
                console.log(error);
                reject(error);
            };
        })
    });
}

function niceCouponList(kw = null, page=1) {
    if (kw === 'all') kw = null;
    return new Promise((resolve, reject) => {
        let query = {
            'adzone_id': adzone_id,
            'platform': '2',
            // 'cat': '16,18',
            'page_size': '100',
            'page_no': page
        };
        kw && (query.q = kw);
        client.execute('taobao.tbk.dg.item.coupon.get', query, function (error, response) {
            if (!error) resolve(response);
            else reject(error);
        })
    });
}

// function categories(pid = '0', cid) {
//     return new Promise((resolve, reject) => {
//         let params = {
//             // 'cids': '18957,19562',
//             'datetime': '2017-07-14 00:00:00',
//             'fields': 'cid,parent_cid,name,is_parent',
//             'parent_cid': pid
//         };
//         cid && (params.cids=cid);
//         client.execute('taobao.itemcats.get', params, (error, response) => {
//             if (!error) resolve(response);
//             else reject(error);
//         })
//     });
// }

/**
 * 淘抢购清单
 */
function hotList(start= moment(), page = 1) {
    return new Promise((resolve, reject) => {
        client.execute('taobao.tbk.ju.tqg.get', {
            'adzone_id': adzone_id,
            'fields': 'click_url,pic_url,reserve_price,zk_final_price,total_amount,sold_num,title,category_name,start_time,end_time',
            'start_time': moment(start).format('YYYY-MM-DD HH:mm:ss'),//最早开团时间
            'end_time': moment(start).endOf('hour').format('YYYY-MM-DD HH:mm:ss'),//最晚开团时间
            'page_no': page,
            'page_size': '95'
        }, function (error, response) {
            if (!error) resolve(response);
            else reject(error);
        });
    });
}

module.exports = router;