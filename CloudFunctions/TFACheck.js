
module.exports = (params) => {
  const Nexmo = require('nexmo');
  const nexmo = new Nexmo({
    apiKey: '1f8d2514',
    apiSecret: 'nkmw41gsgBBKA63l'
  });
  console.log("params", params);
  return new Promise(function (resolve, reject) {
    console.log("inside promise tfacheck")
    nexmo.verify.check({ request_id: params.requestId, code: params.pin }, (err, result) => {
      console.log("inside tfa verify check");
      console.log(err, result);
      if (err) {
        //console.log('error occured',err)
        reject({ resData: 'error' })
        // handle the error
      } else {
        console.log('Account verification Processed')
        if(result != undefined){
          console.log("result", result);
          resolve({ resData: result.status });  
        }
      }
    });
  });
  //    return {values:params.phoneNumber}
};
