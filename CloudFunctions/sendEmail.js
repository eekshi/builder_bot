module.exports=(params)=> {
    var Cloudant = require('cloudant');
    var nodemailer = require('nodemailer');
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
                //console.log("body in send Email",body);
                //console.log('date',body.docs[0].contextId)
                var transporter = nodemailer.createTransport({
                  service: 'gmail',
                  auth: {
                    user: 'moturipavani123@gmail.com',
                    pass: '9491495883'
                  }
                });

                var mailOptions = {
                  from: 'moturipavani123@gmail.com',
                  to: body.docs[0].userEmail,
                  subject: 'Statement from Telco Bot',
                  text: 'Please find the attachement for Your March 2019 statement'
                };

                transporter.sendMail(mailOptions, function(error, info){
                  if (error) {
                    //console.log(error);
                      reject ({resData:'error'})
                  } else {
                    //console.log('Email sent: ' + info.response);
                    resolve({resData:"Success"})
                  }
                });
              }
            })
      })

//    return {values:params.phoneNumber}
  }

  //exports.main({fbId:"12345"})
