var pg = require('pg');
if (process.env.ENVIRONMENT == "PRODUCTION") {
	var conString = "postgres://barter:swipeyswipe@barterdb.cdqggtkygnqt.us-west-1.rds.amazonaws.com/barter";
}
else if (process.env.TRAVIS == "true") {
	var conString = "postgres://postgres@localhost/travis_ci_test"
}
else {
	var conString = "postgres://barter:swipeyswipe@localhost/barter";
}

var db = {};

module.exports = function(callback) {
	pg.connect(conString, function(err, client, done) {
		if (err)
			return console.error('error fetching client from pool', err);

		//Returns N items to the user
		db.getNItems = function(data, cb) {
			client.query('SELECT id AS item_id, user_id, item_description, item_title, item_image FROM items WHERE user_id != $2 LIMIT $1', [data.num, data.user_id], function(err, result) {
				cb(err, result.rows);
			});
		};

		db.updateLocation = function(data, cb) {
			client.query('UPDATE users SET latitude = $1, longitude = $2 WHERE email = $3', [data.lat, data.long, data.email], function(err, result) {
				cb(err, result)
			});
		};

		// get info for an item
		db.getItemInfo = function(data, cb) {
			client.query('SELECT * FROM items WHERE id = $1', [data.itemId], function(err,result) {
					cb(err,result);
			});
		};

		// get users that have liked an item
		db.getItemLikers = function(data, cb) {
			// make sure item exists
			client.query('SELECT id FROM items WHERE id = $1', [data.item_id], function(err,result) {
				if (err) {
					return cb(err,result);
				}
				else if (result.rows.length == 0) {
					return cb({missingMessage: "Item doesn't exist!"}, result);
				}
				// item exists, get the liking users
				client.query('SELECT DISTINCT user_id FROM likedItems WHERE item_id = $1', [data.item_id], function(err,result) {
						return cb(err,result);
				});
			});
		};

		// get info for collection of item ids
		db.getItemsInfo = function(data, cb) {
			// generate query string for selecting on multiple ids
			var queryStr = 'SELECT * FROM items WHERE id in (';
			for (var i = 0; i < data.ids.length; i++) {
				if (i == 0) {
					queryStr += data.ids[i];
				}
				else {
					queryStr += "," + data.ids[i];
				}
			}
			queryStr += ')';
			// perform query
			client.query(queryStr, function(err,result) {
				cb(err,result);
			});
		};

		//Returns items closest to the user that the user hasn't seen yet
		//data has fields: latitude, longitude, and max_items
		db.getLocalItems = function(data, cb) {
			client.query('SELECT items.id AS item_id, items.user_id AS user_id, item_description, item_title, item_image ' +
				'FROM items, users ' +
				'LEFT OUTER JOIN seenitems ON seenitems.user_id = $3 ' +
				'LEFT OUTER JOIN likeditems ON likeditems.user_id = $3 ' +
				'WHERE (seenitems.item_id != items.id OR seenitems.id is null) AND ' + //exclude items that this user has seen
				'(likeditems.item_id != items.id OR likeditems.id is null) AND ' + //exclude items that this user has liked
				'users.id = items.user_id AND ' + //join on users to use user location data
				'users.id != $3 AND ' + //don't show items of the user
				"items.last_modified + interval '14 days' > NOW() " + //don't pull items that are older than 2 weeks
				'ORDER BY earth_distance(ll_to_earth(users.latitude::float8, users.longitude::float8), ll_to_earth($1, $2)) ' +
				'LIMIT $4',
				[data.latitude, data.longitude, data.user_id, data.max_items],
				function(err, result) {
					if (err)
						return cb(err, null);
					cb(err, result.rows);
			});
		};

		//insert a new user into the table
		db.createUser = function(data, cb) {
			client.query('INSERT INTO users(first_name, last_name, email, hashed_pass, latitude, longitude, about_me, user_image) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id',
			  [data.first_name, data.last_name, data.email, data.hashed_pass, data.latitude, data.longitude, data.about_me, data.user_image], function(err, result) {
				cb(err, result);
			});
		};

		//get user information
		db.getUserInfo = function(user_id, cb) {
			client.query('SELECT first_name, last_name, email, hashed_pass, last_logged_on, date_created, latitude, longitude, about_me, user_image FROM users WHERE id = $1', [user_id], function(err, result) {
				cb(err, result);
			});
		};

		//update user info
		db.updateUser = function(data, cb) {
			client.query('UPDATE users SET first_name = $1, last_name = $2, about_me = $3, user_image = $4, email = $5, hashed_pass = $6 WHERE id = $7',
			  [data.first_name, data.last_name, data.about_me, data.user_image, data.email, data.hashed_pass, data.id], function(err, result) {
				cb(err, result);
			});
		};

		//get the password for the user
		db.getBasicUserInfo = function(email, cb) {
			client.query('SELECT id, hashed_pass, email FROM users WHERE email = $1', [email], function(err, result)
			{
					cb(err, result);
			})};

		db.deleteUser = function(data, cb) {
			client.query('DELETE FROM users WHERE id = $1', [data.user_id], function(err,result) {
				cb(err,result);
			});
		};

		db.getUserItems = function(data, cb) {
			client.query('SELECT items.id as item_id FROM items WHERE items.user_id = $1', [data.user_id], function(err,result) {
				cb(err,result);
			});
		};

		//insert a new item into the table
		db.createItem = function(data, cb) {
			client.query('INSERT INTO items(user_id, item_title, item_description, item_image) VALUES ($1,$2,$3,$4) RETURNING id', [data.uid, data.title, data.description, data.image], function(err, result) {
				cb(err, result);
			});
		};

		// retrieve item ids that have been liked by a user
		db.getLikedItems = function(data, cb) {
			client.query('SELECT item_id FROM likedItems WHERE user_id = $1', [data.userId], function(err,result) {
				cb(err,result);
			});
		};

		//add an item that has been liked, no duplicates
		db.addItemLiked = function(data, cb) {
			client.query('INSERT INTO likedItems(user_id, item_id) SELECT $1, $2 WHERE NOT EXISTS( \
			SELECT * FROM likedItems WHERE user_id = $1 AND item_id = $2)', [data.uid, data.iid], function(err, result)  {
				cb(err, result);
			});
		};

		db.deleteLikedItem = function(data,cb) {
			client.query('DELETE FROM likedItems WHERE user_id = $1 AND item_id = $2 RETURNING item_id', [data.user_id, data.item_id], function(err,result) {
				cb(err,result);
			});
		};

		//add an item that has been seen, no duplicates
		db.addItemSeen = function(data, cb) {
			client.query('INSERT INTO seenItems(user_id, item_id) SELECT $1, $2 WHERE NOT EXISTS( \
			SELECT * FROM seenItems WHERE user_id = $1 AND item_id = $2)', [data.uid, data.iid], function(err, result)  {
				cb(err, result);
			});
		};

		//delete an item
		db.deleteItem = function(data, cb) {
			client.query('DELETE FROM items WHERE id = $1', [data.id], function(err, result) {
				cb(err, result);
			});
		};

		//update item info
		db.updateItem = function(data, cb) {
			//if we received no data to update then don't do anything
			if (!data.item_description && !data.item_title && !data.item_image)
				cb(null, true);

			var query = 'UPDATE items SET';
			var firstClause = true;

			if (data.item_description) {
				if (firstClause) {
					query += ' item_description = $1';
					firstClause = false;
				} else
					query += ', item_description = $1';
			}

			if (data.item_title) {
				if (firstClause) {
					query += ' item_title = $2';
					firstClause = false;
				} else
					query += ', item_title = $2';
			}

			if (data.item_image) {
				if (firstClause) {
					query += ' item_image = $3';
					firstClause = false;
				} else
					query += ', item_image = $3';
			}

			query += ' WHERE id = $4';

			client.query(
				query,
				[data.item_description, data.item_title, data.item_image, data.id],
				function(err, result) {
					cb(err, result);
				}
			);
		};

		callback(err, db);
	});
};
