var express = require('express'),
    router = express.Router();

router.use('/', function(req, res, next) {
    req.Response = function(code, data, message) {
        this.code = code || 0;
        this.message = message || "";
        this.data = data || null;
    }

    req.Response.prototype = {
        setCode: function(code) {
            this.code = code;
        },
        setMessage: function(message) {
            this.message = message;
        },
        setData: function(data) {
            this.data = data;
        }
    }
    next();
});
module.exports = router;