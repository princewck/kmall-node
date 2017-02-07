var express = require('express'),
    router = express.Router();

router.use('/', function(req, res, next) {
    req.Response = function(code, data, message) {
        this.code = code || 0;
        this.message = message || "";
        this.data = data || null;
    }
    next();
});
module.exports = router;