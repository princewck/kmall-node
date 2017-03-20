function CategoryGroup(db, cb) {
    return db.define('category_group', {
       id: Number,
       name: String,
       description: String,
       sort: Number,
       status: Boolean
    });
}
CategoryGroup.hasMany = ['categories', 'category', {}, {reverse: 'categoryGroups', key: true, autoFetch: true}];
module.exports = CategoryGroup;
