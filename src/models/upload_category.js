/**
 * 导入文件中的一级分类，惟一对应一个系统的一级分类categoryGroup
 */
function UploadCategory(db) {
   return db.define('upload_category', {
        id: {type: 'serial', key: true},
        name: String
    });
}

UploadCategory.hasOne = ['group', 'category_group', {autoFetch: true}];

module.exports = UploadCategory;
