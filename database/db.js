var pg = require('pg');
var conString = "postgres://barter:swipeyswipe@db.raycoll.me/barter";

var db = {};

module.exports = function(callback) {
	pg.connect(conString, function(err, client, done) {
		if (err)
			return console.error('error fetching client from pool', err);

		//insert a new user into the table
		db.createUser = function(data, cb) {
			client.query('INSERT INTO users(first_name, last_name, email, hashed_password) VALUES($1,$2,$3,$4)', [data.first, data.last, data.email, data.hashed_password], function(err, result) {
				cb(err, result);
			});
		};

		//insert a new item into the table
		db.createItem = function(data, cb) {
			client.query('INSERT INTO items(item_title, item_description, item_image) VALUES($1,$2,$3)', [data.title, data.image, data.description], function(err, result) {
				cb(err, result);
			});
		};	

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
