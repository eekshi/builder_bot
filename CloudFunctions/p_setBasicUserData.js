module.exports=  (params) =>{
    var Cloudant = require('cloudant');
    require('dotenv').config()
    var cloudant = new Cloudant({ url: process.env.Cloudant_Url, maxAttempt: 5, plugins: [ 'iamauth', { retry: { retryDelayMultiplier: 4, retryErrors: true, retryInitialDelayMsecs:1000, retryStatusCodes: [ 429 ] } } ]});
    var userDB = cloudant.db.use('users_db');
      return new Promise(function(resolve,reject){
        //console.log(params);
        var query={
            "selector": {
               "fbId": {
                  "$eq": params.fbId
               }
            },
            "fields": []
          }
            userDB.find(query,(err,body)=>{
              if(err){
                //console.log('err getting cloudant')
                reject ({resData:'error'})
              }
              else{
                if(Object.keys(body.docs).length==0){
                  //console.log('no User');
                  resolve({resData:'wrongCredentials'})
                }
                else if(body.docs.length>0){
                    //console.log("inside setBasic Data else");
                    body.docs[0][params.key]=params.value;
                    //console.log("Before inserting",body.docs[0]);
                    userDB.insert(body.docs[0], function(err, body1, header) {
                    if (err) {
                          reject ({resData:err.message});
                        }else{
                            //console.log('You have inserted the rabbit.');
                            resolve({resData:'Done'})
                        }
                  
                      })
                }                
              }
            })
      })
   
  };
