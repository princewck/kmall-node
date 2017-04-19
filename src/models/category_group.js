function CategoryGroup(db, cb) {
    return db.define('category_group', {
       id: Number,
       name: String,
       description: String,
       sort: Number,
       ceil_price:Number,//最高价，用于过滤9块9和20封顶等
       floor_price: Number,
       on_banner: Boolean,//在banner展示,
       on_navbar: Boolean,//在导航展示
       status: Boolean,
       default_category: Number,//对应默认的一级分组
    });
}
CategoryGroup.hasMany = ['categories', 'category', {}, {reverse: 'categoryGroups', key: true, autoFetch: true}];
module.exports = CategoryGroup;
