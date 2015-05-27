module.exports = function(db) {
  var express = require('express');
  var router = express.Router();

  router.get('/', function(req, res) {
      res.send("Welcome to the Sample Backend for Layer Authentication");
  });

  router.post('/authenticate', function(req, res){

  // Layer Vars

   if(!process.env.LAYER_PROVIDER_ID)
   {
      res.send("Couldn't find LAYER_PROVIDER_ID");
   }

   if(!process.env.LAYER_KEY_ID)
   {
      res.send("Couldn't find LAYER_KEY_ID");
   }


  // Get Provider and Key ID's from Heroku Environment Variables
  var layerProviderID = process.env.LAYER_PROVIDER_ID;
  var layerKeyID = process.env.LAYER_KEY_ID;

  // Obtain Private Key from Layer Dashboard
  // Try to get the file from the layer-key.pem file
  if (fs.existsSync('layer-key.pem')) {
    var privateKey = fs.readFileSync('layer-key.pem');
  }
  else{
      // If layer-key.pem file doesn't exist, try the Heroku Environment Variables
    var privateKey = process.env.LAYER_KEY;
  }

   if(!privateKey)
   {
      res.send("Couldn't find Layer Private Key");
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

      console.log(new r.Signature());

      var jws = r.jws.JWS.sign('RS256', header, claim, privateKey.toString());

      res.json({'identity_token': jws})
  });

  return router;
}
