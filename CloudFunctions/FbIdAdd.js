module.exports=  (params) =>{
    var Cloudant = require('cloudant');
    require('dotenv').config();
    // var username = 'abe71fbc-5e57-4a43-81f8-9e9c9535a33d-bluemix';
    // var password = '3eed17b095b64eb28fdeb6f5c49cec69f519be78c9897173c1616563133b4874';
    // var cloudant = Cloudant({account:username, password:password});
    var cloudant = new Cloudant({ url: process.env.Cloudant_Url, maxAttempt: 5, plugins: [ 'iamauth', { retry: { retryDelayMultiplier: 4, retryErrors: true, retryInitialDelayMsecs:1000, retryStatusCodes: [ 429 ] } } ]});
    var userDB = cloudant.db.use('banking_bot_users');
      return new Promise(function(resolve,reject){
        //console.log(params);
        var query={
            selector: {
               userEmail: {
                  "$eq": params.userEmail
               },
               password:{
                   "$eq":params.userPassword
               }
            }
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
                    //console.log('this is get response')
                    //console.log(body.docs[0]); 
                    if(body.docs[0].facebookId==''){
                    var dataRes=body.docs[0];
                    dataRes.facebookId=params.fbId;
                    userDB.insert(dataRes, function(err, body1, header) {

                        if (err) {
                          reject ({resData:err.message});
                        }else{
                            //console.log('You have inserted the rabbit.');
                            //console.log(body1);
                            body1['phoneNo']=body.docs[0].phoneNo;
                            resolve({resData:body1})
                        }
                  
                      });
                    }else{
                      resolve({resData:'fbIdExist'})
                    }
                }                
              }
            })
      })
   
  };
