var express = require('express');
var path = require('path');
var dbconfig = require('./db/config');
//var favicon = require('serve-favicon');
var logger = require('morgan');
//var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var mysqlStore = require('express-mysql-session');
var cors = require('cors')
var api = require('./routes/api');
//var oauth = require('./routes/oauth');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
//app.use(cookieParser());
/*
app.use(cors({
            credentials: true, 
            origin: [
		    'http://localhost:3000',
		    'https://csunion.nctu.me',
		    'https://fee.csunion.nctu.me',
		    'https://xmas.csunion.nctu.me',
		    /https:\/\/.*.csunion.nctu.me?.*/
	    ]
}));
*/
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  // res.header("Access-Control-Allow-Credentials",true);
  // res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

var sessionStore = new mysqlStore(dbconfig.session);

app.use(session({
  name: 'session',
  secret: 'csunionxmas',
  store: sessionStore,
  saveUninitialized: true, // 是否自動儲存未初始化的會話，建議false
  resave: false, // 是否每次都重新儲存會話，建議false
  cookie: {
    domain: 'csunion.nctu.me',
    maxAge: 600 * 1000 // 有效期，單位是毫秒
    }
}));

app.use('/_api', api);
//app.use('/auth', oauth);


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
  res.render('error');
});

module.exports = app;
