module.exports = function(db) {
	var express = require('express');
	var router = express.Router();

	//logs in a user
	router.post('/login', function(req, res, next) {
		var data = {}
		data.email = req.body.email;
		db.loginUser(data, function(err, result) {
			if (err) next(err);
			if (req.body.password === result.hashed_pass)
				res.send(result.id);
			else
				res.sendStatus(403);
		});
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
