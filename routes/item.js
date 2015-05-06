module.exports = function(db) {
	var express = require('express');
	var router = express.Router();
	var uuid = require('node-uuid');

	//set an item as liked by a certain user
	router.post('/liked', function(req, res, next) {
		var data = {};
		data.uid = req.body.userId;
		data.likesRegistered = true;
		for (var x = 0; x < req.body.itemIds; x++) {
			data.iid = req.body.itemIds[x];
			db.addItemLiked(data, function(err, itemLikeRegistered) {
				if (err) next(err);
				if (!itemLikeRegistered)
					data.likesRegistered = false;
			});
		}

		if (!data.likesRegistered)
			res.sendStatus(500);
		else
			res.sendStatus(200);
	});

	//create a new item
	router.post('/', function(req, res, next) {
		db.createItem(req.body, function(err, itemCreated) {
			if (err) next(err);
			if (itemCreated)
				res.sendStatus(200);
			else
				res.sendStatus(500);
		});
	});

	//delete a specified item
	router.delete('/:itemId', function(req, res, next) {
		var data = {};
		data.id = req.params.itemId;

		db.deleteItem(data, function(err, itemDeleted) {
			if (err) next(err);
			if (itemDeleted)
				res.sendStatus(200);
			else
				res.sendStatus(500);
		});
	});

	return router;
};
