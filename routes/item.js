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
		var image = req.body.item_picture;
		
		var imageName = uuid.v1();
		fs.writeFile(imageName, image, function(err) {
			if (err) next(err);

			//replace the image with the image name which is what we're actually storing in the db.
			req.body.item_picture = imageName;

			db.createItem(req.body, function(err, itemCreated) {
				if (err) next(err);
				if (itemCreated)
					res.sendStatus(200);
				else
					res.sendStatus(500);
			});
		});
	});

	return router;
};
