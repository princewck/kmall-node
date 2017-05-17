function Category(db, cb) {
    return db.define('category', {
       id: Number,
       name: String,
       description: String,
       sort: Number,
       status: Boolean,
       keywords: String, //根据这个关键字列表自动匹配分类,
       xpk_name: String,
       xpk_last_update: Date
    });
}
module.exports = Category;