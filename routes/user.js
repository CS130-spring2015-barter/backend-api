var express = require('express');
var router = express.Router();

//Register a new user. Values passed will be email address and hashed password.
//All values will be in req.body
router.post('/user', function(req, res, next) {
	
	res.send('index');
});

module.exports = router;
