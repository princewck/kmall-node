
/**
 * 默认模板，可用于选品库导出的xls的导入
 * 将上传得到的数组转换成对象，从数组转换，所以依赖于列的顺序和列数
 * @param {array} xlsArr 
 */
function parseProducts(xlsArr, cid, brand_id, description) {
    var keys = [
        'product_id',
        'product_name',
        'product_image',
        'product_detail_page',
        'shop_name',
        'price',
        'monthly_sold',
        'benefit_ratio',
        'benefit_amount',
        'seller_wangid',
        'short_share_url',
        'share_url',
        'share_command',
        'coupon_total_amount',
        'coupon_left_amount',
        'coupon_text',
        'coupon_start',
        'coupon_end',
        'coupon_link',
        'coupon_command',
        'coupon_short_url'
    ];
    return xlsArr.map(function (product) {
        var p = {};
        for (var i = 0; i < keys.length; i++) {
            p[keys[i]] = product[i];
        }
        p.cid = cid;
        p.brand_id = brand_id;
        p.status = true;
        p.description = description;
        p.creation_date = new Date();
        p.coupon_price = getCouponPrice(p.coupon_text);
        p.real_price = p.price - Number(p.coupon_price);
        p.real_price = p.real_price > 0 ? p.real_price : p.price;
        p.platform = null;
        return p;
    }).filter(function (p) {
        //过滤空白行
        return p.product_id && p.product_name;
    });
}

/**
 * 导入每日更新的精选优质商品
 * @param {arr} xlsArr 表格数据
 * @param {number} cid 分类名
 * @param {number} brand_id 品牌
 * @param {string} description 
 */
function parseXLSDaily(xlsArr, cid, brand_id, description) {
    var headArr = xlsArr.shift();
    var mapperHelper = mapper(headArr);
    return xlsArr.map(function (product, index) {
        var p = mapperHelper(product);
        if (index === 0) console.log(p);
        // var p = {
        //     'product_id': product[0],
        //     'product_name': product[1],
        //     'product_image': product[2],
        //     'product_detail_page': product[3],
        //     'shop_name': product[12],
        //     'price': product[6],
        //     'monthly_sold': product[7],
        //     'benefit_ratio': product[8],
        //     'benefit_amount': product[9],
        //     'seller_wangid': product[10],
        //     'short_share_url': product[5],
        //     'share_url': product[5],
        //     'share_command': null,
        //     'platform': product[13] == '天猫' ? 'tmall' : 'taobao',
        //     'coupon_total_amount': product[15],
        //     'coupon_left_amount': product[16],
        //     'coupon_text': product[17],
        //     'coupon_start': product[18],
        //     'coupon_end': product[19],
        //     'coupon_link': product[21],
        //     'coupon_command': null,
        //     'coupon_short_url': product[21],
        //     'uploadCategory': product[4]
        // };
        p.coupon_price = getCouponPrice(p.coupon_text);
        p.real_price = p.price - Number(p.coupon_price);
        p.real_price = p.real_price > 0 ? p.real_price : p.price;
        // p.cid = cid;
        // p.brand_id = brand_id;
        p.status = true;
        p.description = description;
        p.creation_date = new Date();
        return p;
    }).filter(function (p, index) {
        //过滤空白行和销量过低的商品,这里表头不满足p.monthly_sold，所以也被隐含的去除了。
        return p.product_id && p.product_name && Number.parseInt(p.monthly_sold) > 200;
    });
}

function mapper(arr) {
    var productMapper = {};
    arr.forEach((item, index) => {
        if (keyMap.hasOwnProperty(item)) {
            productMapper[keyMap[item]] = index;
        }
    });
    return function (pArr) {
        var product = {};
        for(key in productMapper) {
            if (key === 'platform') {
                product[key] = pArr[productMapper[key]] === '天猫' ? 'tmall' : 'taobao';
            } else {
                product[key] = pArr[productMapper[key]];                
            }
        }
        return product;
    }
}

var keyMap = {
    '商品一级分类': 'uploadCategory',
    '商品一级类目': 'uploadCategory',
    '店铺名称': 'shop_name',
    '平台类型': 'platform',
    '商品id': 'product_id',
    '商品名称': 'product_name',
    '商品连接': 'product_detail_page',
    '淘宝客链接': 'share_url',
    '商品月销量': 'monthly_sold',
    '商品详情页链接地址': 'product_detail_page',
    '商品主图': 'product_image',
    '商品价格(单位：元)': 'price',
    '收入比率(%)': 'benefit_ratio',
    '佣金': 'benefit_amount',
    '卖家旺旺': 'seller_wangid',
    '店铺名称': 'shop_name',
    // '开推时间': 
    '优惠券面额': 'coupon_text',
    '券后价': 'real_price',//not exist
    '优惠券总量': 'coupon_total_amount',
    '优惠券剩余量': 'coupon_left_amount',
    '优惠券开始时间': 'coupon_start',
    '优惠券结束时间': 'coupon_end',
    '推广链接': 'coupon_link',
    '商品优惠券推广链接': 'coupon_link',
    '备注': 'remark', // not exist
};

function getCouponPrice(couponExpression) {
    var p = /\d{1,}/g;
    var arr = couponExpression.match(p);
    arr = arr || [0];
    var couponPrice = Math.min.apply(Math, arr);
    return couponPrice || null;
}

module.exports = {
    parseXLSDefault: parseProducts, //选品库的列顺序模板
    parseXLSDaily: parseXLSDaily //每日精选的模板
};

