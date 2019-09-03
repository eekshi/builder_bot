module.exports = (params) => {
   
    var Cloudant = require('cloudant');
    require('dotenv').config();
    // require('dotenv').config();
    var cloudantURL = "https://e3ac4c51-e9db-4ca2-bd1c-496c30d68953-bluemix:a9b28932b59b6b2be1e20ae67a08592fb997fde38f5fa4f1dacc172533f447bd@e3ac4c51-e9db-4ca2-bd1c-496c30d68953-bluemix.cloudantnosqldb.appdomain.cloud";
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
