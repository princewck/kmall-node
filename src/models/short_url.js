function ShortUrl(db, cb) {
    return db.define('short_url', {
        id:  {type: 'serial', key: true},
        url: {type: 'text'},
        short_url_id: String,
        status: Boolean,
        description: String
        }
    );
}
module.exports = ShortUrl;