var mysql = require('mysql');
var pool = mysql.createPool({
    host: '192.168.0.0',
    user: 'root',
    password: '',
    database: 'kmall',
    port: 3306
});

module.exports = pool;