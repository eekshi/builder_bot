module.exports=(params)=> {
    var Cloudant = require('cloudant');
    require('dotenv').config();
    // var username = 'abe71fbc-5e57-4a43-81f8-9e9c9535a33d-bluemix';
    // var password = '3eed17b095b64eb28fdeb6f5c49cec69f519be78c9897173c1616563133b4874';
    // var cloudant = Cloudant({account:username, password:password});
    var cloudant = new Cloudant({ url: process.env.Cloudant_Url, maxAttempt: 5, plugins: [ 'iamauth', { retry: { retryDelayMultiplier: 4, retryErrors: true, retryInitialDelayMsecs:1000, retryStatusCodes: [ 429 ] } } ]});
    var userDB = cloudant.db.use('community');
      return new Promise(function(resolve,reject){
        //console.log(params);
        var query=
        {
           "selector": {
              "$or": [
                 {
                    "zipcode": {
                       "$eq": params.code
                    }
                 },
                 {
                    "city": {
                       "$eq": params.code
                    }
                 }
              ]
           },
           "fields": []
        }
        
        userDB.find(query,(err,body)=>{
              if(err){
                //console.log('err getting cloudant')
                reject ({resData:'error'})
              }else{
                //console.log("body",body); 
                resolve({resData:body})
              }
            })
      })
   
//    return {values:params.phoneNumber}
  }

  //exports.main({fbId:"12345"})