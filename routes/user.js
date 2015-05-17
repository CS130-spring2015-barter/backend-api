module.exports = function(db) {
	var express = require('express');
	var passport = require('passport');
	var expjwt = require('express-jwt');
	var jwt = require('jwt-simple');
	var bcrypt = require('bcrypt');
	var router = express.Router();

	//gets user info for a specific :userId
	router.get('/:userId',
		function(req, res, next) {
			var user_id = req.params.userId;
			db.getUserInfo(user_id, function(err, result) {
				if (err) next(err);

				if (result.rows.length == 0) {
					return res.status(404).send({message: "No such user!"});
				}

				// clear null values from result row (user might not have image, about_me, etc)
				var userInfo = {};
				var userRow = result.rows[0];
				for (var i in userRow) {
					if (userRow[i] != null) {
						userInfo[i] = userRow[i];
					}
				}

				return res.send(userInfo);
			});
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
			var payload = { user_id: user.id};
			var token = jwt.encode(payload, 'testsecretdontusethis');
	    return res.send({token: token, user_id: user.id});
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
		db.getBasicUserInfo(req.body.email, function(err, result) {
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
				var user_id = userRegistered.rows[0].id;
				res.send(200,{user_id: user_id});
			});
		});
	});

	return router;
};
