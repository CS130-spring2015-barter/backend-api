var pg = require('pg');
var conString = "postgres://barter:swipeyswipe@db.raycoll.me/barter";

var db = {};

pg.connect(conString, function(err, client, done) {
	if (err)
		return console.error('error fetching client from pool', err);

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
});

module.exports = db;
