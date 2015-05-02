module.exports = function(db) {
	var express = require('express');
	var router = express.Router();

	//login a user
	router.get('/', function(req, res, next) {
		res.send('userget');
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
