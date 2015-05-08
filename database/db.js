var pg = require('pg');
var conString = "postgres://barter:swipeyswipe@barterdb.cdqggtkygnqt.us-west-1.rds.amazonaws.com/barter";

var db = {};

module.exports = function(callback) {
	pg.connect(conString, function(err, client, done) {
		if (err)
			return console.error('error fetching client from pool', err);

		//insert a new user into the table
		db.createUser = function(data, cb) {
			client.query('INSERT INTO users(first_name, last_name, email, hashed_pass, location) VALUES ($1,$2,$3,$4,($5,$6)', [data.first, data.last, data.email, data.hashed_password, data.long, data.lat], function(err, result) 
			{
				cb(err, result);
			});
		};

		//get user information
		db.getUserInfo = function(data, cb) {
			client.query('SELECT first_name, last_name, email, last_logged_on, date_created FROM users WHERE id = $1', [data.id], function(err, result) 
			{
				cb(err, result);
			});
		};

		//update user info
		db.updateUser = function(data, cb) {
			client.query('UPDATE users SET first_name = $1, last_name = $2, about_me = $3, user_image = $4 WHERE id = $5', [data.first, data.last, data.about, data.image, data.uid], function(err, result) {
				cb(err, result);
			});
		}


		//get the password for the user
		db.loginUser = function(data, cb) {
			client.query('SELECT hashed_pass, id FROM users WHERE email = $1', [data.email], function(err, result) 
			{
				if (err) 
				{
					cb(err, result);
				}
				client.query('UPDATE users SET location = ($1,$2) WHERE email = $3', [data.long, data.lat, data.email], function(err, result)
				{
					cb(err, result);
				});
			});
		};

		//insert a new item into the table
		db.createItem = function(data, cb) {
			client.query('INSERT INTO items(user_id, item_title, item_description, item_image) VALUES ($1,$2,$3,$4)', [data.uid, data.title, data.image, data.description], function(err, result) 
			{
				cb(err, result);
			});
		};

		//add an item that has been liked
		db.addItemLiked = function(data, cb) {
			client.query('INSERT INTO likedItems(user_id, item_id) VALUES ($1,$2)', [data.uid, data.iid], function(err, result) 
			{
				cb(err, result);
			});
		};

		//add an item that has been seen
		db.addItemSeen = function(data, cb) {
			client.query('INSERT INTO seenItems(user_id, item_id) VALUES ($1,$2)', [data.uid, data.iid], function(err, result) 
			{
				cb(err, result);
			});
		};

		//delete an item
		db.deleteItem = function(data, cb) {
			client.query('DELETE FROM items WHERE id = $1', [data.id], function(err, result) 
			{
				cb(err, result);
			});
		};

		//update item info
		db.updateItem = function(data, cb) {
			client.query('UPDATE items SET item_description = $1, item_title = $2, item_image = $3 WHERE id = $4', [data.description, data.title, data.image, data.iid], function(err, result) {
				cb(err, result);
			});
		}
	
		//example query 
		/*client.query('SELECT $1::int AS number', ['1'], function(err, result) {
			// call `done()` to release the client back to the pool 
			done();
			if(err) {
				return console.error('error running query', err);
			}
			console.log(result.rows[0].number);
			client.end();
		});*/

		callback(err, db);
	});
};
