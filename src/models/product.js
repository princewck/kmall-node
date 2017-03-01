function Product(db, cb) {
    return db.define('product', {
        id: Number,
        cid: Number,
        brand_id: Number,
        product_id: Number,
        product_name: String,
        product_image: String,
        product_detail_page: String,
        shop_name: String,
        price: Number,
        monthly_sold: Number,
        benefit_ratio: Number,
        seller_wangid: String,
        short_share_url: String,
        share_url: String,
        share_command: String,
        total_amount: Number,
        left_amount: Number,
        coupon_text: String,
        coupon_start: Date,
        coupon_end: Date,
        coupon_link:String,
        coupon_command: String,
        coupon_short_url: String
    }, {
        methods: {
            getInfo: function() {
                delete this.benefit_ratio;
                return this;
            }
        }
    });
}
module.exports = Product;