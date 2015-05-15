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
	      return res.send({ success : false, message : 'authentication failed' });
	    }
	    return res.send(user);
	  })(req, res, next);
	});


	//Register a new user. Values passed will be email address and hashed password.
	//All values will be in req.body
	router.post('/', function(req, res, next) {
		db.createUser(req.body, function(err, userRegistered) {
			if (err) next(err);
			if (userRegistered)
				res.sendStatus(200);
			else
				res.sendStatus(500);
		});
	});

	return router;
};
