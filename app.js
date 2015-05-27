module.exports = function(dbObject) {
	var express = require('express');
	var path = require('path');
	var bcrypt = require('bcrypt');
	var passport = require('passport');
	var expjwt = require('express-jwt');
	var favicon = require('serve-favicon');
	var logger = require('morgan');
	var cookieParser = require('cookie-parser');
	var bodyParser = require('body-parser');
	var multer = require('multer');
	var LocalStrategy   = require('passport-local').Strategy;
	var user = require('./routes/user')(dbObject);
	var item = require('./routes/item')(dbObject);
	var chat = require('./routes/chat')(dbObject);
	var app = express();

	// view engine setup
	app.set('views', path.join(__dirname, 'views'));
	app.set('view engine', 'jade');

	// setup passport local
	passport.use(new LocalStrategy({
		usernameField : 'email',
		passwordField: 'password'
	},
	function(email, reqPassword, done) {
		dbObject.getBasicUserInfo(email, function(err, result) {
			if (err) return done(err);

			if (!result.rows.length)
				return done(null, false, {message: "No such email!"});

			var userBcryptPass = result.rows[0].hashed_pass;
			// password match
			bcrypt.compare(reqPassword, userBcryptPass, function(err, correct) {
				if (err) return done(err);

				if (correct)
					return done(null, result.rows[0]);
				else
					return done(null, false, {message: "Invalid Password!"});
			});
		});
	}));

	// setup jwt authentication middleware
	app.use(expjwt({
	  secret: 'testsecretdontusethis',
	  credentialsRequired: true,
	  getToken: function fromHeaderOrQuerystring (req) {
	    if (req.headers.authorization) {
	        return req.headers.authorization;
	    }
			else {
	    	return null;
			}
	  }
	}).unless({ path: ['/user', '/user/login', /\/user\/[0-9]+/i] })); // no token read for user creation/login

	// uncomment after placing your favicon in /public
	//app.use(favicon(__dirname + '/public/favicon.ico'));
	app.use(logger('dev'));
	app.use(bodyParser.json({limit: '50mb'}));
	app.use(bodyParser.urlencoded({ extended: false }));
	app.use(cookieParser());
	app.use(express.static(path.join(__dirname, 'public')));
	app.use(multer({ dest: './public/images/', inMemory: true}));


	app.use('/user', user);
	app.use('/item', item);
	app.use('/chat', chat);

	// catch 404 and forward to error handler
	app.use(function(req, res, next) {
	  var err = new Error('Not Found');
	  err.status = 404;
	  next(err);
	});

	// add error handler for invalid tokens
	app.use(function(err, req, res, next) {
		if (err.name === 'UnauthorizedError') {
    	res.send(500, {message: "Invalid Token"});
  	}
		else {
			next(err);
		}
	});

	//default error catcher
	app.use(function(err, req, res, next) {
		console.log(err.message);
		res.sendStatus(500);
	});

	return app;
};
