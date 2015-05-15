module.exports = function(db) {
	var express = require('express');
	var passport = require('passport');
	var expjwt = require('express-jwt');
	var jwt = require('jwt-simple');
	var router = express.Router();

	//gets user info for a specific :userId
	router.get('/:userId', expjwt({secret: 'testsecretdontusethis'}),
		function(req, res, next) {
			return res.send(req.user.email);
		/*
		var data = {}
		data.id = req.params.userId;
		db.getUserInfo(data, function(err, userInfo) {
			if (err) next(err);
			res.send(userInfo);
		});
		*/
	});


router.post('/login', function(req, res, next) {
	  passport.authenticate('local', function(err, user, info) {
	    if (err) {
	      return next(err);
	    }
	    if (!user) {
	      return res.status(401).send(info);
	    }

			// generate token for this user
			var payload = { email: user.email };
			var token = jwt.encode(payload, 'testsecretdontusethis');
	    return res.send({token: token});
	  })(req, res, next);
	});


	//Register a new user. Values passed will be email address and password.
	//All values will be in req.body
	router.post('/', function(req, res, next) {
		db.createUser(req.body, function(err, userRegistered) {
			if (err) {
				return next(err);
			}
			res.send(200);
		});
	});

	return router;
};
