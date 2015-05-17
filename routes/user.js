module.exports = function(db) {
	var express = require('express');
	var passport = require('passport');
	var expjwt = require('express-jwt');
	var jwt = require('jwt-simple');
	var bcrypt = require('bcrypt');
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
	  passport.authenticate('local', function(err, email, info) {
	    if (err) {
	      return next(err);
	    }
	    if (!email) {
	      return res.status(401).send(info);
	    }

			// generate token for this user
			var payload = { email: email };
			var token = jwt.encode(payload, 'testsecretdontusethis');
	    return res.send({token: token});
	  })(req, res, next);
	});


	//Register a new user.
	router.post('/', function(req, res, next) {
		if (!req.body.password) {
			return res.status(400).send({message: "Must provide password!"});
		}
		if (!req.body.email) {
			return res.status(400).send({message: "Must provide email!"});
		}
		if (!req.body.first || !req.body.last) {
			return res.status(400).send({message: "Must provide first/last name!"});
		}

		// Make sure user doesnt already exist
		db.getPass(req.body.email, function(err, result) {
			if (result.rows.length != 0) {
				return res.status(400).send({message: "User already exists!"});
			}

			// Create bcrypted password and save user
			var salt = bcrypt.genSaltSync(10);
			var passwordHash = bcrypt.hashSync(req.body.password, salt);
			req.body.password = passwordHash;

			db.createUser(req.body, function(err, userRegistered) {
				if (err) {
					return next(err);
				}
				res.send(200);
			});
		});
	});

	return router;
};
