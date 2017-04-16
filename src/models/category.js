function Category(db, cb) {
    return db.define('category', {
       id: Number,
       name: String,
       description: String,
       sort: Number,
       status: Boolean,
       keywords: String //根据这个关键字列表自动匹配分类
    });
}
module.exports = Category;