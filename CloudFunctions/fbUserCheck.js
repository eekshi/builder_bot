module.exports=(params)=> {
    var Cloudant = require('cloudant');
    require('dotenv').config();
    var cloudant = new Cloudant({ url: process.env.Cloudant_Url, maxAttempt: 5, plugins: [ 'iamauth', { retry: { retryDelayMultiplier: 4, retryErrors: true, retryInitialDelayMsecs:1000, retryStatusCodes: [ 429 ] } } ]});
    var userDB = cloudant.db.use('users_db');
      return new Promise(function(resolve,reject){
        //console.log(params);
        var query={
            "selector": {
               "fbId": {
                  "$eq": params.fbId
               }
            }
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