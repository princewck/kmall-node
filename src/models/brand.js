// var category = require('./category');
function Brands(db, cb) {
    return db.define('brand', {
        id: Number,
        name: String,
        image: String,
        description: String,
        sort: Number,
        status: Boolean
    });
}

Brands.hasMany = ['categories', 'category', {}, {reverse: 'brands', key: true, autoFetch: false}];
module.exports = Brands;