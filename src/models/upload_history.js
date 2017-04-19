function UploadHistory(db, cb) {
    return db.define('upload_history', {
        id: {type: 'serial', key: true},
        start: Date,
        end: Date,
        count: Number, //条数
        duplicate_count: Number,//重复条数
        err_count: Number,
        cid: Number,
        brand_id: Number,
        type: Number, //1 选品库， 2每日精选
        done: {type:'boolean', defaultValue: false}//是否完成
    });
}
module.exports = UploadHistory;