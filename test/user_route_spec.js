var frisby = require("../node_modules/frisby/lib/frisby");
var testUid = null;

frisby.create('Create a new user')
  .post('localhost:3000/user', {
    first_name: "tom",
    last_name: "brady",
    email: "golden_boy@nesn.com",
    password: "godeep123"
  })
  .expectStatus(200)
.toss();

frisby.create('Login as user')
  .post('localhost:3000/login', {
    email: "golden_boy@nesn.com",
    password: "godeep123"
  })
  .expectStatus(200)
  .expectJSONTypes({
    token: String
    user_id: Number
  })
  .afterJSON(function (res) {
    // Set testUid for later requessts
    testUid = res.user_id;
    /* include auth token in the header of all future requests */
    frisby.globalSetup({
      request: {
        headers: { 'Authorization': res.token }
      }
    })

    frisby.create('Make sure info for user exists')
      .get('localhost:3000/user/' + testUid)
      .expectStatus(200)
      .expectJSONTypes({
        email: String,
        first_name: String,
        last_name: String
      })
    .toss();
  })
.toss();

frisby.create('Update user email')
  .post('localhost:3000/user/userId', {
    email: "golden_boy1@nesn.com"
  })
  .expectStatus(200)
  .after(function(err, res, body) {
    frisby.create('Make sure user info is updated')
      .get('localhost:3000/user/' + testUid)
      .expectStatus(200)
      .expectJSONTypes({
        email: String,
        first_name: String,
        last_name: String
      })
      .after(function(err, res, body) {
        expect(res.email).toMatch('golden_boy1@nesn.com')
      })
    .toss();
  })
.toss();
