module.exports = function(db) {
	var express = require('express');
	var router = express.Router();
	var async = require('async');

	//get a list of 25 items that the user hasn't seen yet in geographic order
	router.get('/geo', function(req, res, next) {
		/*var data = {}
		if (req.query.max_items) {
			data.num = req.query.max_items;
		}
		else {
			data.num = 5;
		}
		db.getNItems(data, function(err, items) {
			if (err) return next(err);

			res.send(items);
		});*/
		var data = {
			latitude: req.query.lat,
			longitude: req.query.long,
			max_items: req.query.max_items || 5,
			user_id: req.query.user_id
		};
		
		db.getLocalItems(data, function(err, items) {
			if (err) next(err);
			res.send(items);
		});
	});

	// set item(s) as seen by a certain user
	// does NOT allow a user to "see" their own items
	router.post('/seen', function(req, res, next) {
		var data = {
			uid: req.body.user_id
		};

		var itemIds = req.body.item_ids;

		var dataInputs = [];

		db.getUserItems({user_id: req.body.user_id}, function(err,userItems) {
			for (var i = 0; i < itemIds.length; i++) {
				// check each of the user's items against the potential seen item
				for (var j = 0; j < userItems.rows.length; j++) {
					if (itemIds[i] == userItems.rows[j].item_id) {
						return res.status(500).send({message: "Can't see an item the user owns!"});
					}
				}
				// not a user's item, it can be added
				dataInputs.push({
					uid: req.body.user_id,
					iid: itemIds[i]
				});
			}
			// Add to seenitems
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
	});

	// Removes all items from a user's seen list
	// TODO: make sure user exists
	router.delete('/seen', function(req,res,next) {
		if (!req.query.user_id) {
			return res.status(500).send({message: "Must provide user_id"});
		}

		db.deleteAllUserSeen({user_id: req.query.user_id}, function(err,result) {
			if (err) {
				return next(err);
			}

			return res.sendStatus(200);
		});
	});

	//gets item_ids that a user has liked
	router.get('/liked', function(req, res, next) {
		var userId = req.query.user_id
		if (!userId) {
			return res.status(500).send({message: "No user_id supplied!"});
		}

		var data = {userId: userId};
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

	// set an item as liked by a certain user
	// does NOT allow a user to like their own item
	router.post('/liked', function(req, res, next) {
		var data = {
			uid: req.body.user_id
		};

		var itemIds = req.body.item_ids;
		var dataInputs = [];

		// make sure user isn't trying to like their own item
		db.getUserItems({user_id: req.body.user_id}, function(err,userItems) {
			if (err) return next(err);

			for (var i = 0; i < itemIds.length; i++) {
				// check each of the user's items against the potential liked item
				// return error if it is one of the user's items
				for (var j = 0; j < userItems.rows.length; j++) {
					if (itemIds[i] == userItems.rows[j].item_id) {
						return res.status(500).send({message: "Can't like an item the user owns!"});
					}
				}
				// not a user's item, it can be liked
				dataInputs.push({
					uid: req.body.user_id,
					iid: itemIds[i]
				});
			}

			// Add all items to likedItems table
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
	});

	// TODO: make sure user exists
	router.delete('/liked', function(req,res,next) {
		if (!req.query.user_id) {
			return res.status(500).send({message: "Must provide user_id"});
		}

		db.deleteAllUserLiked({user_id: req.query.user_id}, function(err,result) {
			if (err) {
				return next(err);
			}

			return res.sendStatus(200);
		});
	});

	// remove a given item from a users "liked" collection
	router.delete('/:itemId/liked', function(req,res,next) {
		if (!req.query.user_id) {
			return res.status(500).send({message: "Must provide user_id!"});
		}

		db.deleteLikedItem({user_id: req.query.user_id, item_id: req.params.itemId}, function(err, result) {
			if (err) {
				return next(err);
			}
			// deleteLikedItem query returns the id that was deleted, if nothing returned, the item wasn't liked
			if (result.rows.length ==  0) {
				return res.status(500).send({message: "Item wasn't liked!"});
			}

			db.addItemSeen({uid: req.query.user_id, iid: req.params.itemId}, function(err,result) {
				if (err) {
					return next(err);
				}

				// successfully added item to the seen table
				return res.sendStatus(200);
			});
		});
	});

	//create a new item
	router.post('/', function(req, res, next) {
		if (req.get('Content-Type') != 'application/json') {
			return res.status(500).end({message: "Only acceptable Content-type is application/json!"});
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

	// retrieve multiple items(ids query param MUST be provided)
	// ids are expected to be delivered in CSV format: ids=1,2,3
	// TODO: verify that all item_ids the user requests actually exist
	router.get('/', function(req, res, next) {
		if (!req.query.ids) {
			return res.status(500).send({message: "item_ids must be provided!"});
		}
		var ids = req.query.ids.split(",");

		// retrieve items from db
		db.getItemsInfo({ids: ids}, function(err, result) {
			if (err) {
				return next(err);
			}
			var infos = result.rows;

			// rename id to item_id for output
			for (var i = 0; i < infos.length; i++) {
				infos[i].item_id = infos[i].id;
				delete infos[i].id;
			}
			return res.send(infos);
		});
	});

	// retrieve user ids who have liked a given item
	router.get('/:itemId/user', function(req,res,next) {
		var itemId = req.params.itemId;
		db.getItemLikers({item_id: itemId}, function(err, result) {
			if (err) {
				// item doesn't exist error
				if (err.missingMessage) {
					return res.status(500).send({message: err.missingMessage});
				}
				else {
					return res.sendStatus(500);
				}
			}
			var likingUsers = {};
			likingUsers.user_ids = [];
			for (var i = 0; i < result.rows.length; i++) {
				likingUsers.user_ids.push(result.rows[i].user_id);
			}
			return res.send(likingUsers);
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
