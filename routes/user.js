module.exports = function(db) {
	var express = require('express');
	var router = express.Router();

	//login a user
	router.get('/', function(req, res, next) {
		res.send('userget');
	});

	return router;
};
