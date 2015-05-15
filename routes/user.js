module.exports = function(db) {
	var express = require('express');
	var passport = require('passport');
	var router = express.Router();

	//gets user info for a specific :userId
	router.get('/:userId', function(req, res, next) {
		var data = {};
		data.id = req.params.userId;
		db.getUserInfo(data, function(err, userInfo) {
			if (err) next(err);
			res.send(userInfo);
		});
	});


router.post('/login', function(req, res, next) {
	  passport.authenticate('local', function(err, user, info) {
	    if (err) {
	      return next(err);
	    }
	    // Generate a JSON response reflecting authentication status
	    if (!user) {
	      return res.status(401).send(info);
	    }
	    return res.send(user);
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
