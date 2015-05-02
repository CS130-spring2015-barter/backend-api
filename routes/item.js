module.exports = function(db) {
	var express = require('express');
	var router = express.Router();

	router.get('/:userId', function(req, res, next) {
		db.createItem(req.body, function(err, itemCreated) {
			if (err) next(err);
			if (itemCreated)
				res.sendStatus(200);
			else
				res.sendStatus(500);
		});
	});

	return router;
};
