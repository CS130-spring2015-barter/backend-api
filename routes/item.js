module.exports = function(db) {
	var express = require('express');
	var router = express.Router();
	var async = require('async');

	//get a list of 25 items that the user hasn't seen yet in geographic order
	router.get('/geo', function(req, res, next) {
		var data = {}
		data.num = 15;
		db.getNItems(data, function(err, items) {
			if (err) next(err);

			res.send(items);
		});
		/*
		db.getGeolocatedItems(data, function(err, items) {
			if (err) next(err);
			res.send(items);
		});
		*/
	});

	//set an item as seen by a certain user
	router.post('/seen', function(req, res, next) {
		var data = {
			uid: req.body.user_id
		};

		var itemIds = req.body.item_ids;

		var dataInputs = [];

		for (var i = 0; i < itemIds.length; i++) {
			dataInputs.push({
				uid: req.body.user_id,
				iid: itemIds[i]
			});
		}

		async.map(dataInputs, db.addItemSeen, function(err, result) {
			var inserted = result.reduce(function(prev, cur) {
				return prev * cur;
			});

			if (inserted)
				res.sendStatus(200);
			else
				res.sendStatus(500);
		});
	});

	//set an item as liked by a certain user
	router.post('/liked', function(req, res, next) {
		var data = {
			uid: req.body.user_id
		};

		var itemIds = req.body.item_ids;
		var dataInputs = [];

		for (var i = 0; i < itemIds.length; i++) {
			dataInputs.push({
				uid: req.body.user_id,
				iid: itemIds[i]
			});
		}

		async.map(dataInputs, db.addItemLiked, function(err, result) {
			var inserted = result.reduce(function(prev, cur) {
				return prev * cur;
			});

			if (inserted)
				res.sendStatus(200);
			else
				res.sendStatus(500);
		});
	});

	//create a new item
	router.post('/', function(req, res, next) {

		var data = {
			uid: req.body.user_id,
			title: req.body.item_title,
			image: req.files.item_picture.buffer,
			description: req.body.item_description
		};

		db.createItem(data, function(err, itemCreated) {
			if (err) next(err);
			if (itemCreated)
				res.sendStatus(200);
			else
				res.sendStatus(500);
		});
	});

	// retrieve info for an item by id
	router.get('/:itemId', function(req, res, next) {
		db.getItemInfo({itemId: req.params.itemId}, function(err, result) {
			if (err)
				return res.sendStatus(500);
			if (result.rows.length == 0) {
				return res.sendStatus(404);
			}
			itemInfo = result.rows[0];
			itemInfo.item_id = result.rows[0].id;
			delete itemInfo.id;
			return res.send(itemInfo);
		});
	});

	//updates an existing item
	router.put('/:itemId', function(req, res, next) {
		req.body.id = req.params.itemId;
		db.updateItem(req.body, function(err, itemUpdated) {
			if (err) next(err);
			if (itemUpdated)
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
