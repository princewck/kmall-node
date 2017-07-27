var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var app = express();
var session = require('express-session');
var MySQLStore = require('express-mysql-session')(session);
var uuid = require('uuid');
var configurations = require('./.config.js');

var middleware = {
    api: require('./middleware/api'),
    response: require('./middleware/response'),
    prototype: require('./middleware/prototype'),
    authenticateSystem: require('./middleware/authenticate-systemuser')
}


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'plain');

app.set('trust proxy', 1);
var sessionOptions = configurations.sessionMysqlStorageConfig;
var sessionStore = new MySQLStore(sessionOptions);
app.use(session({
  genid: function(req) {
    return uuid.v1(); // use UUIDs for session IDs
  },
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
  store: sessionStore,
  cookie: { 
    // http协议设为true会出现每次请求都生成不同sessionID的问题
    secure: false,
    maxAge: 3600000 * 24,//session有效期为24小时
    httpOnly: false
  }
}));

app.use(bodyParser.urlencoded({
  limit: '50mb',
  extended: true
}));
app.use(bodyParser.json({limit: '50mb'}));

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
// app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(middleware.prototype);
//自定义的中间件
app.use(middleware.api);
app.use(middleware.response);
app.use('/admin', middleware.authenticateSystem);//用户认证


(function() {
  //路由列表
  var routes = {
    admin: require('./routes/api/admin'),
    test:  require('./routes/api/test'),
    user: require('./routes/api/user'),
    category: require('./routes/api/category'),
    brand: require('./routes/api/brand'),
    products: require('./routes/api/products'),
    oss: require('./routes/api/oss'),
    configs: require('./routes/api/configs'),
    alimama: require('./routes/api/alimama'),
    uploadCategory: require('./routes/api/upload_category'),
    utils: require('./routes/api/utils')
  }
  var routesArr = [];
  for (k in routes) routesArr.push(routes[k]);
  //自定义的路由
  app.use.apply(app, ['/', ...routesArr]);  
}());

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  // render the error page
  res.status(err.status || 500);
  console.log(err);
  res.send('error');
});

module.exports = app;