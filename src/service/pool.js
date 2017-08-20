var mysql = require('mysql');
var configuration = require('../.config');
var pool = mysql.createPool(configuration.mysqlPoolConfig);

module.exports = pool;