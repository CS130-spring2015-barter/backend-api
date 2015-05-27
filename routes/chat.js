module.exports = function(db) {
  var express = require('express');
  var router = express.Router();
  var r = require('jsrsasign');

  router.post('/authenticate', function(req, res){
    if (!req.body.user_id) {
      return res.status(500).send({message: "Must provide user_id!"});
    }
    if (!req.body.nonce) {
      return res.status(500).send({message: "Must provide nonce!"});
    }

    // Layer Vars, generated from Layer dashboard
    var layerProviderID = process.env.LAYER_PROVIDER_ID;
    var layerKeyID = process.env.LAYER_KEY_ID;
    var privateKey = process.env.LAYER_PRIVATE_KEY;

    if(!process.env.LAYER_PROVIDER_ID){
       return res.status(500).send("Couldn't find LAYER_PROVIDER_ID");
     }
    if(!process.env.LAYER_KEY_ID) {
       return res.status(500).send("Couldn't find LAYER_KEY_ID");
    }
    if(!privateKey) {
       return res.status(500).send("Couldn't find Layer Private Key");
    }

   var header =  JSON.stringify({
      typ: "JWS", // Expresses a MIMEType of application/JWS
      alg: "RS256", // Expresses the type of algorithm used to sign the token, must be RS256
      cty: "layer-eit;v=1", // Express a Content Type of application/layer-eit;v=1
      kid: layerKeyID,
   });

   var currentTimeInSeconds = Math.round(new Date() / 1000);
   var expirationTime = currentTimeInSeconds + 10000;

   var claim = JSON.stringify({
     iss: layerProviderID, // The Layer Provider ID
     prn: req.body.user_id, // User Identifier
     iat: currentTimeInSeconds, // Integer Time of Token Issuance
     exp: expirationTime, // Integer Arbitrary time of Token Expiration
     nce: req.body.nonce, //Nonce obtained from the Layer Client SDK
   });

   var jws = r.jws.JWS.sign('RS256', header, claim, privateKey.toString());

   res.json({'layer_token': jws})
  });

  return router;
}
