function Category(db, cb) {
    return db.define('category', {
       id: Number,
       name: String,
       description: String,
       sort: Number 
    });
}
module.exports = Category;