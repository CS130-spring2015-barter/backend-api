module.exports = function(dbObject) {
	var express = require('express');
	var path = require('path');
	var bcrypt = require('bcrypt');
	var passport = require('passport');
	var favicon = require('serve-favicon');
	var logger = require('morgan');
	var cookieParser = require('cookie-parser');
	var bodyParser = require('body-parser');
	var multer = require('multer');
	var LocalStrategy   = require('passport-local').Strategy;
	var user = require('./routes/user')(dbObject);
	var item = require('./routes/item')(dbObject);
	var app = express();

	// view engine setup
	app.set('views', path.join(__dirname, 'views'));
	app.set('view engine', 'jade');

	// setup passport local
	passport.use(new LocalStrategy({
		usernameField : 'email',
		passwordField: 'password'
	},
  function(email, password, done) {
			dbObject.getPass(email, function(err, pass) {
				if (err) {
					return done(err);
				}
				else {
					return done(null, {email: email, password: password});
				}
			})
		}));

	// uncomment after placing your favicon in /public
	//app.use(favicon(__dirname + '/public/favicon.ico'));
	app.use(logger('dev'));
	app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({ extended: false }));
	app.use(cookieParser());
	app.use(express.static(path.join(__dirname, 'public')));
	app.use(multer({ dest: './public/images/', inMemory: true}));


	app.use('/user', user);
	app.use('/item', item);

	// catch 404 and forward to error handler
	app.use(function(req, res, next) {
	  var err = new Error('Not Found');
	  err.status = 404;
	  next(err);
	});

	// error handlers

	// development error handler
	// will print stacktrace
	if (app.get('env') === 'development') {
	  app.use(function(err, req, res, next) {
		res.status(err.status || 500);
		res.send(err.message + '\n' + err);
	  });
	}

	// production error handler
	// no stacktraces leaked to user
	app.use(function(err, req, res, next) {
	  res.status(err.status || 500);
	  res.send(err.message);
	});


	return app;
};
