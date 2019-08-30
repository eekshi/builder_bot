module.exports = (params) => {
   
    var Cloudant = require('cloudant');
    require('dotenv').config();
    // require('dotenv').config();
    var cloudantURL = "https://3bd18d5b-085c-4f56-8c1c-b265c0c58d3c-bluemix:f82abbe20a98df82420da4290f655a84afc8baf0faf697211dc9d0bbed46e93b@3bd18d5b-085c-4f56-8c1c-b265c0c58d3c-bluemix.cloudantnosqldb.appdomain.cloud";
    var cloudant = new Cloudant({ url: cloudantURL, maxAttempt: 5, plugins: ['iamauth', { retry: { retryDelayMultiplier: 4, retryErrors: true, retryInitialDelayMsecs: 1000, retryStatusCodes: [429] } }] });
    var userDB = cloudant.db.use('users_db');
    return new Promise(function (resolve, reject) {

        userDB.list( (err, body) => {
            if (err) {
              //  //console.log('err getting cloudant')
                reject({ resData: 'error' })
            } else {
                for (let i = 0; i < body.rows.length; i++) {
                    userDB.destroy(body.rows[i].id, body.rows[i].value.rev, function (err) {
                        if (err) {
                            reject({ resData: 'error' });
                        } else {
                           // //console.log(i);
                            if(body.rows.length - 1 == i){
                                resolve({ resData: 'success' });
                            }
                        }
                    });
                }
                if(body.rows.length == 0 ){
                    resolve({ resData: 'success'})
                }
            }
        })
    })
}