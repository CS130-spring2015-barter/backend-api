var frisby = require("../node_modules/frisby/lib/frisby");

frisby.create('Example GET')
  .get('http://example.com')
  .expectStatus(200)
.toss();

frisby.create('Example POST')
  .post('http://example.com')
  .expectStatus(200)
.toss();
