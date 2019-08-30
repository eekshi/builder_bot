module.exports=  (params) =>{
    var Cloudant = require('cloudant');
    require('dotenv').config();
    var cloudant = new Cloudant({ url: process.env.Cloudant_Url, maxAttempt: 5, plugins: [ 'iamauth', { retry: { retryDelayMultiplier: 4, retryErrors: true, retryInitialDelayMsecs:1000, retryStatusCodes: [ 429 ] } } ]});
  //  var userDB = cloudant.db.use('users_db');
      return new Promise(function(resolve,reject){
        //console.log(params);
     var data={
        "userEmail": "",
        "password": "",
        "userName": "",
        "phoneNo":"" ,
        "fbId": params.fbId,
        "firstOtp": "No",
        "requestId": "",
        "jwtToken": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJkYXRhIjoiQmFua2luZ0JvdCIsImlhdCI6MTU2MTYzMTY1MywiZXhwIjoxNTYxNjMxODMzfQ.0UkuXMRbKjqfY6BzZbRMKPIhQJNL7F2Resg4OQaIQls",
        "otpAttempt": false
     }
    //  cloudant.db.create('users_db', (err) => {
    //     if (err) {
    //       //console.log(err);
    //       reject ({resData:err.message});
    //     } else {
    //       cloudant.use('users_db').insert(data,(err, body1) => {
           
    //         if (err) {
    //             reject ({resData:err.message});
    //           }else{
    //               //console.log('You have inserted the rabbit.');
    //              // //console.log(body1);
    //               resolve({resData:body1})
    //           }
    //       });
    //     }
    //   });
     cloudant.db.use('users_db').insert(data, function(err, body1, header) {

            if (err) {
              reject ({resData:err.message});
            }else{
                //console.log('You have inserted the rabbit.');
               // //console.log(body1);
                resolve({resData:body1})
            }
      
          });
      })
   
  };
  
