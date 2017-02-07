function Configuration(db, cb) {
    return db.define('configurations', {
        id: Number,
        module: String,
        code: String,
        value: String,
        description: String,
        status: [0, 1]
    }, {
        methods: {
            getStatus: function() {
                return Boolean(Number(this.status));
            }
        }
    });
}
module.exports = Configuration;