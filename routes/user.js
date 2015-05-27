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

	// User update route
	router.put('/:userId',
		function(req,res,next) {
			var userId = req.params.userId;
			var reqInfo= req.body;
			db.getUserInfo(userId, function(err, result) {
				if (err) next(err);

				if (result.rows.length == 0) {
					return res.status(404).send({message: "No such user!"});
				}

				// Update fields for the user based on the request body
				var updatedInfo = result.rows[0];
				for (var i in updatedInfo) {
					// Update field in user info only if it exists in request body
					if (reqInfo[i]) {
						updatedInfo[i] = reqInfo[i];
					}
				}
				// Handle password update
				if (reqInfo.password) {
					var salt = bcrypt.genSaltSync(10);
					updatedInfo.hashed_pass = bcrypt.hashSync(reqInfo.password, salt);
				}

				// Add user id to user_info object
				updatedInfo.id = userId;

				// Save the updated user info back to the database
				db.updateUser(updatedInfo, function(err, result) {
					if (err) {
						return next(err);
					}
					else {
						return res.send(updatedInfo); // this will have hashed_pass in it(remove later)
					}
				})
			})
		}
	);

	router.post('/login', function(req, res, next) {
	  passport.authenticate('local', function(err, user, info) {
	    if (err) {
	      return next(err);
	    }
	    if (!user) {
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
		if (!req.body.first_name || !req.body.last_name) {
			return res.status(400).send({message: "Must provide first/last name!"});
		}

		// Make sure user doesnt already exist
		db.getBasicUserInfo(req.body.email, function(err, result) {
			if (result.rows.length != 0) {
				return res.status(400).send({message: "User already exists!"});
			}

			// Create bcrypted password for user
			var newUser = req.body;
			var salt = bcrypt.genSaltSync(10);
			newUser.hashed_pass = bcrypt.hashSync(req.body.password, salt);

			// Give default values to missing optional fields
			if (!newUser.latitude || !newUser.longitude) {
				newUser.latitude = 0;
				newUser.longitude = 0;
			}
			if (!newUser.about_me) {
				newUser.about_me = null;
			}
			if (!newUser.user_image) {
				newUser.user_image = null;
			}

			// save the new user
			db.createUser(req.body, function(err, userRegistered) {
				if (err) {
					return next(err);
				}
				var user_id = userRegistered.rows[0].id;
				res.send(200,{user_id: user_id});
			});
		});
	});

	//gets items for a specific user
	router.get('/:userId/item', function(req, res, next) {
		var user_id = req.params.userId;
		// make sure user exists
		db.getUserInfo(user_id, function(err, result) {
			if (err) {
				return next(err);
			}
			if (result.rows.length == 0) {
				return res.status(404).send({message: "No such user!"});
			}

			// retrieve users items from db
			db.getUserItems({user_id: user_id}, function(err, result) {
				if (err) {
					return next(err);
				}
				var userItems = {};
				userItems.item_ids = [];
				for (var i = 0; i < result.rows.length; i++) {
					userItems.item_ids.push(result.rows[i].item_id);
				}
				return res.send(userItems);
			});
		});
	});

	return router;
};
