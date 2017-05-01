
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
    return xlsArr.map(function (product) {
        var p = {
            'product_id': product[0],
            'product_name': product[1],
            'product_image': product[2],
            'product_detail_page': product[3],
            'shop_name': product[12],
            'price': product[6],
            'monthly_sold': product[7],
            'benefit_ratio': product[8],
            'benefit_amount': product[9],
            'seller_wangid': product[10],
            'short_share_url': product[5],
            'share_url': product[5],
            'share_command': null,
            'coupon_total_amount': product[15],
            'coupon_left_amount': product[16],
            'coupon_text': product[17],
            'coupon_start': product[18],
            'coupon_end': product[19],
            'coupon_link': product[21],
            'coupon_command': null,
            'coupon_short_url': product[21],
            'uploadCategory': product[4]
        };
        p.coupon_price = getCouponPrice(p.coupon_text);
        // p.cid = cid;
        // p.brand_id = brand_id;
        p.status = true;
        p.description = description;
        p.creation_date = new Date();
        return p;
    }).filter(function (p) {
        //过滤空白行
        return p.product_id && p.product_name;
    });
}

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

