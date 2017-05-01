function Product(db, cb) {
    return db.define('product', {
        product_id: {type: 'number', mapsTo: 'id', index: true},
        cid: Number,
        brand_id: Number,
        status: Boolean,
        description: String,
        creation_date: Date,

        product_name: String,
        product_image: String,
        product_detail_page: String,
        shop_name: String,
        price: Number,
        monthly_sold: Number,
        benefit_ratio: Number,
        benefit_amount:Number, //佣金
        seller_wangid: String,
        short_share_url: String,
        share_url: String,
        share_command: String,
        coupon_total_amount: Number,
        coupon_left_amount: Number,
        coupon_text: String,
        coupon_start: Date,
        coupon_end: Date,
        coupon_link:String,
        coupon_command: String,
        coupon_short_url: String,
        coupon_price: Number
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