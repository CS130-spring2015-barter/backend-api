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
	router.get('/liked', function(req, res, next) {
		var userId = req.query.user_id
		if (!userId) {
			return res.status(500).send({message: "No user_id supplied!"});
		}
		var maxItems = req.query.n;
		// default max item ids to return to 20
		if (!maxItems) {
			maxItems = 20;
		}

		var data = {userId: userId, maxItems: maxItems};
		// Retrive item ids from db
		db.getLikedItems(data, function(err, result) {
			if (err)
				return res.status(500).send({message: "DB lookup error!"});

			var likedItems = {};
			likedItems.item_ids = [];
			for (var i = 0; i < result.rows.length; i++) {
				likedItems.item_ids.push(result.rows[i].item_id);
			}
			return res.send(likedItems);
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
		if (req.get('Content-Type') != 'application/json') {
			return res.status(500).send({message: "Only acceptable Content-type is application/json!"});
		}

		var data = {
			uid: req.body.user_id,
			title: req.body.item_title,
			image: req.body.item_image,
			description: req.body.item_description
		};

		db.createItem(data, function(err, itemCreated) {
			if (err) return next(err);
			if (itemCreated)
				res.send({item_id: itemCreated.rows[0].id});
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
			if (err) return next(err);
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
			if (err) return next(err);
			if (itemDeleted)
				res.sendStatus(200);
			else
				res.sendStatus(500);
		});
	});

	return router;
};
