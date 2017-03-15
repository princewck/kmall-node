/**
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
    return  xlsArr.map(function(product) {
        var p = {};
        for (var i = 0; i < keys.length; i++) {
            p[keys[i]] = product[i];
        }
        p.cid = cid;
        p.brand_id = brand_id;
        p.status = true;
        p.description = description;
        p.creation_date = new Date();
        return p;
    });
}

module.exports = {
    parseXLS: parseProducts
};

