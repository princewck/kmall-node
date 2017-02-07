var mysql = require('mysql');
var pool = mysql.createPool({
    host: '101.200.152.168',
    user: 'root',
    password: 'm2XBfsjn',
    database: 'cyb_forum',
    port: 3306
});

module.exports = pool;