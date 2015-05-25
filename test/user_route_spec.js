var http = require('http');
var request = require('supertest');
var should = require('should');

describe('User routes', function() {
  var token = null;
  var user_id = null;
  var app = null;
  var testDb = null;
  var testServer = null;
  var newUser = { email: "tbrady@nesn.com",
                              password: "godeep123",
                              first_name: "Tom",
                              last_name: "Brady",
                              about_me: "What balls?"};

  // Open db connection and initialize supertest with a test server
  before(function(done) {
    require('../database/db') (function(err, db) {
    	if (err) console.log(err);
      testDb = db;
      app = require('../app.js')(testDb);
      testServer = 	http.createServer(app);
      done();
    });
  })

  it('allows creation of a new user', function(done) {
    request(testServer)
      .post("/user")
      .send(newUser)
      .expect(200)
      .end(function(err,res) {
        if (err) {
          return done(err);
        }
        res.should.be.json;
        user_id = res.body.user_id; // db user row id used for later GETs/PUTs
        done();
      });
  });

  it('allows login for an existing user with valid credentials', function(done) {
    request(testServer)
      .post("/user/login")
      .send({email: newUser.email, password: newUser.password})
      .expect(200)
      .end(function(err,res) {
        if (err) {
          return done(err);
        }
        res.should.be.json;
        user_id = res.body.user_id;
        token = res.body.token; // API auth token used for later requests
        done();
      });
  });

  it('allows retrieving info for a freshly created user', function(done) {
    request(testServer)
      .get("/user/" + user_id)
      .set("Authorization", token)
      .expect(200)
      .end(function(err,res) {
        if (err) {
          return done(err);
        }
        res.should.be.json;
        done();
      });
  });

  it('allows altering an existing user', function(done) {
    request(testServer)
      .put("/user/" + user_id)
      .set("Authorization", token)
      .send({about_me: "Where's Bob?"})
      .expect(200)
      .end(function(err,res) {
        if (err) {
          return done(err);
        }
        res.should.be.json;
        done();
      });
  });

  it('persists user info updates to subsequent requests', function(done) {
    request(testServer)
      .get("/user/" + user_id)
      .set("Authorization", token)
      .expect(200)
      .end(function(err,res) {
        if (err) {
          return done(err);
        }
        res.should.be.json;
        res.body.about_me.should.match("Where's Bob?");
        done();
      });
  });

  // Teardown: delete the created test user
  after(function(done) {
    testDb.deleteUser({user_id: user_id}, function(err, result) {
      if (err) {
        return done(err);
      }
      done();
    })
  })
});
