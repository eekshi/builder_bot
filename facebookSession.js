'use strict';

require('dotenv').config();

const express = require('express'); //app server
const request = require('request'); //request module to make http requests
const bodyParser = require('body-parser'); // parser for post requests
const Conversation = require('watson-developer-cloud/conversation/v1'); // watson sdk, using only conversation service
const numeral = require('numeral');
const jwt = require('jsonwebtoken-refresh');


//cloud functions
const insightsModule = require('./CloudFunctions/insightsModule');
const FbIdCheck = require('./CloudFunctions/FbIdCheck');
const FbIdAdd = require('./CloudFunctions/FbIdAdd');
const TFARegister = require('./CloudFunctions/TFARegister');
const TFACheck = require('./CloudFunctions/TFACheck');
const balCheckFun = require('./CloudFunctions/balCheckFun');
const lostCardFun = require('./CloudFunctions/lostCardFun');
const newCardFun = require('./CloudFunctions/newCardFun');
const checkPayCreditBalFun = require('./CloudFunctions/checkPayCreditBalFun');
const payCreditBalFun = require('./CloudFunctions/payCreditBalFun');
const fundsToInnerAccFun = require('./CloudFunctions/fundsToInnerAccFun');
const firstSecondOTP = require('./CloudFunctions/firstSecondOTP');
//const noOfOTP=require('./CloudFunctions/noOfOTP');
const checkOtherPhoneNo = require('./CloudFunctions/checkOtherPhoneNo');
const transferMoneyToOther = require('./CloudFunctions/transferMoneyToOther');
const otherUserFbId = require('./CloudFunctions/otherUserFbId');
const updateAddress = require('./CloudFunctions/updateAddress');
const getBasicUserData = require('./CloudFunctions/getBasicUserData');
const setBasicUserData = require('./CloudFunctions/setBasicUserData');
const falseTFA = require('./CloudFunctions/falseTFA');
const TFACancel = require('./CloudFunctions/TFACancel');
const listAllusers =  require('./CloudFunctions/listAllusers');
const FbUserCheck =  require('./CloudFunctions/FbUserCheck');
const setBasicUserData1 =  require('./CloudFunctions/p_setBasicUserData');
const fbUserAdd = require('./CloudFunctions/fbUserAdd');


// server  express config
const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(__dirname + '/Login'));


//watson bot object
var conversation = new Conversation({
    url: "https://gateway.watsonplatform.net/conversation/api",

    username: process.env.Watson_User_Name,

    password: process.env.Watson_User_Password,
    version: 'v1',
    version_date: '2018-03-03'
});


var insightPrototype = new insightsModule();


function insightUserRequestFunction(basicDetails) {
    //console.log(basicDetails);
    var requestMessage = {};
    requestMessage.message = {
        address: {
            user: {
                id: basicDetails.resData.userEmail,
                name: basicDetails.resData.userName
            },
            conversation: {
                id: basicDetails.resData.contextId.conversation_id
            }
        },
        type: 'message',
        text: basicDetails.text,
        source: 'FaceBook'

    }

    insightPrototype.logMessage(requestMessage);

}

function insightBotResponseFunction(basicDetails) {
    var responseMessage = {
        type: "message",
        address: {
            user: {
                id: basicDetails.resData.userEmail,
                name: basicDetails.resData.userName
            },
            conversation: {
                id: basicDetails.resData.contextId.conversation_id
            }
        },
        source: "FaceBook",
        text: basicDetails.text
    };

    insightPrototype.logMessage(responseMessage);
}
app.get('/proactiveMessages', (req, res) => {
   // var fbUsers=["2694124463950281","2271641979621103"];
   listAllusers().then((response)=>{
   response.resData.forEach(element => {
          if(element.facebookId!="")
          {
              console.log("IF");
                     loginSuccessMessage(element.facebookId,"60% off on all Jordans!");
                     notifications(element.facebookId);
          }
          else
         {
             console.log("ELSE");
         }

       });  
    res.send('success')
   })

})

//app.use(insightFunction());
//post api for user login credentials
app.post('/checkCredentials', (req, res) => {
    console.log('check credentials');
    FbIdCheck({ fbId: req.body.href }).then((respData) => {
        if (respData.resData == 'error') {
            console.log('error occured');
            res.send('error');
            loginSend(req.body.entry[0].messaging[i].sender.id, "Sorry, something went wrong. Please login again!");
        } else if (Object.keys(respData.resData.docs) > 0) {
            console.log('user available');
            res.send({ key: 'available', value: "You are already logged in!" });
            loginSuccessMessage(req.body.entry[0].messaging[i].sender.id, "Hey, you are already logged in! Continue your chat.")
        } else if (respData.resData.docs.length == 0) {
            FbIdAdd({ fbId: req.body.href, userEmail: req.body.userName, userPassword: req.body.userPassword }).then((respData) => {
                if (respData.resData == 'fbIdExist') {
                    res.send({ key: 'wrongCredentials', value: "Sorry, You are already logged in with these credentials in some other facebook ID!" });
                }
                if (respData.resData == 'wrongCredentials') {
                    res.send({ key: 'wrongCredentials', value: "You have entered wrong credentials. Please try again!" });
                } else if (respData.resData == 'error') {
                    res.send({ key: 'error', value: "Server is busy, please try again!" });
                } else if (respData.resData.ok == true) {
                    console.log('added success');
                    TFARegister({ phoneNo: respData.resData.phoneNo }).then((respData) => {
                        if (respData.resData.result.status == 0) {
                            setBasicUserData({ fbId: req.body.href, key: 'requestId', value: respData.resData.result.request_id }).then((respData) => {
                                console.log('setBasic User Data');
                                loginSuccessMessage(req.body.href, "You are successfully logged in! You will get a verification code to your mobile. Please enter the verification code.")

                            })
                        } else if (respData.resData.result.status == 3) {
                            console.log("invalid phone number")
                            loginSuccessMessage(req.body.href, "Your registered phone number doesn't exist. Please check the number and try again!");
                        } else if (respData.resData.result.status == 9) {
                            console.log("Your nexmo account does not have sufficient credit to process this request")
                            loginSuccessMessage(req.body.href, "Our server is busy now. Please try again!");
                        } else if (respData.resData.result.status == 10) {
                            console.log("Concurrent verifications to the same number are not allowed")
                            loginSuccessMessage(req.body.href, "Our server is busy now. Please try again after 5 minutes");
                        } else if (respData.resData.result.status == 15) {
                            console.log("The destination number is not in a supported network")
                            loginSuccessMessage(req.body.href, "Please check your registered phone number and try again!");
                        } else {
                            loginSuccessMessage(req.body.href, "Our server is busy now. Please try again after some time")
                        }
                        // else{
                        //     loginSuccessMessage(req.body.href,"You are successfully logged in! Server is busy now, please try agian after 5 minutes for verification.")

                        // }
                        res.send({ key: 'success', value: "You are successfully logged in!" });

                    })
                } else {
                    console.log('added/data not matched');
                    res.send({ key: 'error', value: "Server is busy, please try again!" });
                }
            })
        }
    })
})
app.get('/sendCards',(req,res)=>{
    sendCards()
res.send("sent");
})


//check the get api

app.get('/getapi', (req, res) => {
    console.log('this is get request');
    setTimeout(() => {
        res.send('thanks for the get request triggering after 10 sec');
    }, 1000);
})

//downloading the get statement page
app.get('/CardStatement', (req, res) => {
    var file = __dirname + '/cardStatement.pdf';
    res.download(file); // Set disposition and send it.
});

//fb login page
app.get('/fblogin', (req, res) => {
    res.sendFile(__dirname + '/Login/login.html');
})

//get webhook api for facebook
app.get('/webhook/', (req, res) => {
    console.log('get webhook');
    if (req.query['hub.verify_token'] === 'MultiChannelBot') {
        res.send(req.query['hub.challenge']);
    } else
        res.send('Error when we try to validating your token.');
});

// app.get('/dayPromotion', (req, res) => {
//     loginSuccessMessage("","60% off on all Jordans!");
//     notifications();
//     res.send('success')
// })

//post webhook api for facebook
app.post('/webhook/', (req, res) => {

    res.sendStatus(200);
    console.log('this is post request');
    //console.log(JSON.stringify(req.body));

    for (let i = 0; i < req.body.entry[0].messaging.length; i++) {
        FbUserCheck({ fbId: req.body.entry[0].messaging[i].sender.id }).then((respData) => {
            conosle.log("respData",respData);
            console.log("req.body.entry[0].messaging[i].sender.id",req.body.entry[0].messaging[i].sender.id);
            if (respData.resData == 'error') {
                console.log('error occured');
                fbUserAdd({ fbId: req.body.entry[0].messaging[i].sender.id}).then((respBasicData)=>{
                console.log('no context');
                conversation.message({ workspace_id: process.env.Watson_Workspace }, function (err, res) {
                    if (err) {
                        console.log('error:', err);
                    }
                    else {
                        if(res.context.isAgentOn== false)
                        {
                            setBasicUserData1({ fbId: req.body.entry[0].messaging[i].sender.id, key: 'contextId', value: res.context }).then((respData) => {
                                console.log('setBasic User Data');
                                //console.log(respData.resData);
                                console.log("req.body.entry[0].messaging[i].message",req.body.entry[0].messaging[i].message);
                                if (req.body.entry[0].messaging[i].message) {
                                    respBasicData.text = req.body.entry[0].messaging[i].message.text;
                                    //  insightUserRequestFunction(respBasicData)
    
                                    watsonRequest("new User", req.body.entry[0].messaging[i].sender.id);
                                }
                                else if (req.body.entry[0].messaging[i].postback) {
                                    respBasicData.text = req.body.entry[0].messaging[i].postback.payload;
                                //   insightUserRequestFunction(respBasicData)
                                    watsonRequest("new User", req.body.entry[0].messaging[i].sender.id);
                                }
     
                            })

                        }
                        else
                        {
                            console.log("Start socket implementation");
                        }
               
                    }
                });
               });
            } else if (respData.resData.docs.length == 0) {
                console.log("inside length==0");
                fbUserAdd({ fbId: req.body.entry[0].messaging[i].sender.id}).then((respBasicData)=>{
                console.log('no context');
                conversation.message({ workspace_id: process.env.Watson_Workspace }, function (err, res) {
                    if (err) {
                        console.log('error:', err);
                    }
                    else {
                        if(res.context.isAgentOn== false)
                        {
                            setBasicUserData1({ fbId: req.body.entry[0].messaging[i].sender.id, key: 'contextId', value: res.context }).then((respData) => {
                                console.log('setBasic User Data');
                                //console.log(respData.resData);
                                console.log("req.body.entry[0].messaging[i].message",req.body.entry[0].messaging[i].message);
                                if (req.body.entry[0].messaging[i].message) {
                                    respBasicData.text = req.body.entry[0].messaging[i].message.text;
                                    //  insightUserRequestFunction(respBasicData)
    
                                    watsonRequest("new User", req.body.entry[0].messaging[i].sender.id);
                                }
                                else if (req.body.entry[0].messaging[i].postback) {
                                    respBasicData.text = req.body.entry[0].messaging[i].postback.payload;
                                //   insightUserRequestFunction(respBasicData)
                                    watsonRequest("new User", req.body.entry[0].messaging[i].sender.id);
                                }
     
                            })

                        }
                        else
                        {
                            console.log("Start socket implementation");
                        }
                    }
                });
               })
     
            }
            else if (respData.resData.docs.length > 0) {
                //                        phoneNo=respData.resData.docs[0].PhoneNo;
                getBasicUserData({ fbId: req.body.entry[0].messaging[i].sender.id }).then((respBasicData) => {
                         console.log('inside get basic user data');
                    if (respBasicData.resData.contextId != "") {
                        console.log('context available');
                        if (req.body.entry[0].messaging[i].message) {
                            respBasicData.text = req.body.entry[0].messaging[i].message.text;
                            insightUserRequestFunction(respBasicData)
                            watsonRequest(req.body.entry[0].messaging[i].message.text, req.body.entry[0].messaging[i].sender.id);
                        }

                        else if (req.body.entry[0].messaging[i].postback) {
                            respBasicData.text = req.body.entry[0].messaging[i].postback.payload;
                            insightUserRequestFunction(respBasicData)
                            watsonRequest(req.body.entry[0].messaging[i].postback.payload, req.body.entry[0].messaging[i].sender.id);
                        }
                    } else {
                        console.log('no context');
                        conversation.message({ workspace_id: process.env.Watson_Workspace }, function (err, res) {
                            if (err) {
                                console.log('error:', err);
                            }
                            else {
                                setBasicUserData({ fbId: req.body.entry[0].messaging[i].sender.id, key: 'contextId', value: res.context }).then((respData) => {
                                    console.log('setBasic User Data');
                                    //console.log(respData.resData);
                                    if (req.body.entry[0].messaging[i].message) {
                                        respBasicData.text = req.body.entry[0].messaging[i].message.text;
                                        insightUserRequestFunction(respBasicData)
                                        watsonRequest(req.body.entry[0].messaging[i].message.text, req.body.entry[0].messaging[i].sender.id);
                                    }
                                    else if (req.body.entry[0].messaging[i].postback) {
                                        respBasicData.text = req.body.entry[0].messaging[i].postback.payload;
                                        insightUserRequestFunction(respBasicData)
                                        watsonRequest(req.body.entry[0].messaging[i].postback.payload, req.body.entry[0].messaging[i].sender.id);
                                    }

                                })
                            }
                        });
                    }
                })
            }
        });
        

    }
});
function notifications(id) {
    var dataPost = {
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: { access_token: process.env.Facebook_Token },
        method: 'POST',
        json: {
            recipient: { id: id },
            message: {
                attachment: {
                    type: "image",
                    payload: {
                        url: "https://cashbackoffer.in/wp-content/uploads/2017/08/Amazon-icici-bank-offer.jpg",
                        is_reusable: true
                    }
                }
            }
        }
    };
    requestFun(dataPost)
}
// function notifications() {
//     var dataPost = {
//         url: 'https://graph.facebook.com/v2.6/me/messages',
//         qs: { access_token: process.env.Facebook_Token },
//         method: 'POST',
//         json: {
//             recipient: { id: "fbId" },
//             message: {
//                 // text: "Today's big sale offer!",
//                 attachment: {
//                     type: "image",
//                     payload: {
//                         url: "https://caratheretailbot.mybluemix.net/carousel?fileName=dayNotification",
//                         is_reusable: true
//                     }
//                 }
//             }
//         }
//     };
//     requestFun(dataPost)
// }

//function for sending plain text to facebook
function loginSuccessMessage(id, text) {

    getBasicUserData({ fbId: id }).then((getResponse) => {
        getResponse.text = text;
        insightBotResponseFunction(getResponse);
    })
    var dataPost = {
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: { access_token: process.env.Facebook_Token },
        method: 'POST',
        json: {
            recipient: { id: id },
            message: {
                text: text
            }
        }
    };
    requestFun(dataPost)
}
//cards
function sendCards(id, text) {

    var dataPost = {
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: { access_token: process.env.Facebook_Token },
        method: 'POST',
        json: {
            recipient: { id: "2271641979621103" },
            message: {
                attachment: {
                    type: "template",
                    "payload": {
                        "template_type": "list",
                        "elements": [
                            {
                                "title": "Miracle's Shoe Corp. Centro comercial Twelve Oaks | Novi, MI - 48374",
                                // "color":"#FF0000",
                                "image_url": "https://nikonrumors.com/wp-content/uploads/2014/03/Nikon-1-V3-sample-photo.jpg",
                                "subtitle": "Tiempos: 9AM to 8PM",
                                "default_action": {
                                    "type": "web_url",
                                    "url": "https://www.miraclesoft.com",
                                    "messenger_extensions": false,
                                    "webview_height_ratio": "compact"
                                }
                            },
                            {
                                "title": "Miracle's Shoe Corp. Centro comercial Twelve Oaks | Novi, MI - 48374",
                                // "color":"#FF0000",
                                "image_url": "https://nikonrumors.com/wp-content/uploads/2014/03/Nikon-1-V3-sample-photo.jpg",
                                "subtitle": "Tiempos: 9AM to 8PM",
                                "default_action": {
                                    "type": "web_url",
                                    "url": "https://www.miraclesoft.com",
                                    "messenger_extensions": false,
                                    "webview_height_ratio": "compact"
                                }
                            },
                            {
                                "title": "Miracle's Shoe Corp. Centro comercial Twelve Oaks | Novi, MI - 48374",
                                // "color":"#FF0000",
                                "image_url": "https://nikonrumors.com/wp-content/uploads/2014/03/Nikon-1-V3-sample-photo.jpg",
                                "subtitle": "Tiempos: 9AM to 8PM",
                                "default_action": {
                                    "type": "web_url",
                                    "url": "https://www.miraclesoft.com",
                                    "messenger_extensions": false,
                                    "webview_height_ratio": "compact"
                                }
                            },
                            {
                                "title": "Miracle's Shoe Corp. Centro comercial Twelve Oaks | Novi, MI - 48374",
                                // "color":"#FF0000",
                                "image_url": "https://nikonrumors.com/wp-content/uploads/2014/03/Nikon-1-V3-sample-photo.jpg",
                                "subtitle": "Tiempos: 9AM to 8PM",
                                "default_action": {
                                    "type": "web_url",
                                    "url": "https://www.miraclesoft.com",
                                    "messenger_extensions": false,
                                    "webview_height_ratio": "compact"
                                }
                            }
                        ]
                    }
                }
            }
        }
    };
    requestFun(dataPost)
}


//login button for facebook
function loginSend(id, text) {

    var dataPost = {
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: { access_token: process.env.Facebook_Token },
        method: 'POST',
        json: {
            recipient: { id: id },
            message: {
                attachment: {
                    type: "template",
                    payload: {
                        template_type: "button",
                        text: text,
                        buttons: [
                            {
                                "type": "account_link",
                                "url": "https://6d451f60.ngrok.io/fblogin?id=" + id,
                            }
                        ]
                    }
                }
            }
        }
    };
    requestFun(dataPost)
}

//request function
function requestFun(dataPost) {

    request(dataPost, (error, response, body) => {
        if (error) {
            console.log('Error when we try to sending message: ', error);
        } else if (response.body.error) {
            console.log('Error: ', response.body.error);
        }
    });

}


//watson conversation
function watsonRequest(input, resp) {
    console.log('this is input data')
    console.log(input)

    getBasicUserData({ fbId: resp }).then((respBasicData) => {
        console.log(respBasicData);
        //console.log(respBasicData.resData);
        var payload =
        {
            workspace_id: process.env.Watson_Workspace,
            input: { "text": input },
            context: respBasicData.resData.contextId
        }

        conversation.message(payload, function (err, responseMessage) {
            if (err) {
                console.log('inside conversation')
                console.log('error occured');
            }
            else {
                console.log('watson response', responseMessage);
                if (JSON.parse(responseMessage.output.text[0]).action == 'process') {
                    if (JSON.parse(responseMessage.output.text[0]).data.function == 'OTP') {
                        console.log('this is otp');
                    } else {
                        setBasicUserData({ fbId: resp, key: 'contextId', value: responseMessage.context }).then((respData) => {
                            console.log('setBasic User Data');
                            // console.log(respData.resData);
                        })
                    }
                } else {
                    setBasicUserData({ fbId: resp, key: 'contextId', value: responseMessage.context }).then((respData) => {
                        console.log('setBasic User Data');
                        // console.log(respData.resData);
                    })
                }
                console.log('this is message');
                messageForwardOrProcess(resp, JSON.parse(responseMessage.output.text[0]));
                //console.log(responseMessage.output.text[0]);
            }
        });
    });
}


//check whether the response is to forward or to process
function messageForwardOrProcess(id, messageLocal) {
    if (messageLocal.action == 'forward') {
        if (messageLocal.hasOwnProperty('ButtonValues')) {
            console.log('buttons available');
            var buttonsAppendText = messageLocal.message;
            var buttons = [];
            for (let i = 0; i < messageLocal.ButtonValues.length; i++) {
                buttons.push({
                    "type": "postback",
                    "title": messageLocal.ButtonNames[i],//SOME ONE ELSE
                    "payload": messageLocal.ButtonValues[i]//soneoneelse
                });
                buttonsAppendText = buttonsAppendText + " -> " + messageLocal.ButtonNames[i];
                if (i == messageLocal.ButtonValues.length - 1) {
                    getBasicUserData({ fbId: id }).then((getResponse) => {
                        getResponse.text = buttonsAppendText;
                        insightBotResponseFunction(getResponse);
                    })
                    buttonSend(id, messageLocal.message, buttons);
                }
            }
        }
        else {
            console.log('no buttons');
            loginSuccessMessage(id, messageLocal.message);
        }

    }
    else if (messageLocal.action == 'access') {
        if (messageLocal.data.function == "otherNumber") {
            checkOtherPhoneNo({ otherPhoneNo: messageLocal.data.number }).then((respData) => {
                //console.log(respData.resData);
                if (respData.resData == "noUser") {
                    loginSuccessMessage(id, "Sorry, there is no user with that phone numuber. Please reenter the phone number.")
                } else {
                    loginSuccessMessage(id, "Okay, initiating money transfer to " + respData.resData.Name + ". How much money do you want to transfer?");
                }
            })
        }
    }
    else if (messageLocal.action == 'process') {
        console.log('!---------message is processing----------!');

        getBasicUserData({ fbId: id }).then((respBasicData) => {
            //console.log(respBasicData.resData);
            if (messageLocal.data.function != 'OTP') {
                // if((new Date().getTime()-timeAtOtpSuccess)>120000){
                //console.log(respBasicData.resData);
                jwt.verify(respBasicData.resData.jwtToken, 'secret', function (err, decoded) {
                    if (err) {
                        // if(false){
                        console.log('error jwt token');
                        setBasicUserData({ fbId: id, key: 'afterOtpProcess', value: messageLocal }).then((respData) => {
                            console.log('setBasic User Data');
                            // console.log(respData.resData);
                            TFARegister({ phoneNo: respBasicData.resData.phoneNo }).then((respData) => {
                                //console.log(respData);
                                if (respData.resData.result.status == 0) {
                                    console.log("this is request Id:" + respData.resData.result.request_id)
                                    setBasicUserData({ fbId: id, key: 'requestId', value: respData.resData.result.request_id }).then((responsesData) => {
                                        //console.log('this is request ID for Nexmo: '+respData.resData.result.request_id);
                                        console.log('inside tfa register done setBasic User Data');
                                        // console.log(respData.resData);
                                        loginSuccessMessage(id, "You will get a verification code to **" + respBasicData.resData.phoneNo.toString().slice(6, 10) + ". Please enter the code to process the functionality.")
                                    })
                                } else if (respData.resData.result.status == 3) {
                                    console.log("invalid phone number")
                                    loginSuccessMessage(id, "Your registered phone number doesn't exist. Please check the number and try again!");
                                } else if (respData.resData.result.status == 9) {
                                    console.log("Your nexmo account does not have sufficient credit to process this request")
                                    loginSuccessMessage(id, "Our server is busy now. Please try again!");
                                } else if (respData.resData.result.status == 10) {
                                    console.log("Concurrent verifications to the same number are not allowed")
                                    loginSuccessMessage(id, "Our server is busy now. Please try again after 5 minutes");
                                } else if (respData.resData.result.status == 15) {
                                    console.log("The destination number is not in a supported network")
                                    loginSuccessMessage(id, "Please check your registered phone number and try again!");
                                } else {
                                    loginSuccessMessage(id, "Our server is busy now. Please try again after some time")
                                }
                            })
                        })
                    } else {
                        console.log('successful jwt token');
                        jwt.refresh(decoded, 3 * 60, 'secret', (err, refreshToken) => {
                            if (err) {
                                console.log('error in refresh token');
                            } else {
                                console.log('refresh successful');
                                console.log(refreshToken);
                                setBasicUserData({ fbId: id, key: 'jwtToken', value: refreshToken }).then((respData) => {
                                    setTimeout(() => {
                                        afterOtpProcessFun(messageLocal, respBasicData.resData.phoneNo)
                                    }, 1000)
                                });
                            }
                        });
                    }


                });
            }
            if (messageLocal.data.function == 'OTP') {
                console.log('this is otp');
                getBasicUserData({ fbId: id }).then((respBasicData) => {
                    // console.log(respBasicData.resData);                
                    TFACheck({ requestId: respBasicData.resData.requestId, pin: messageLocal.data.message }).then((respData) => {
                        if (respData.resData == 0) {
                            firstSecondOTP({ phoneNo: respBasicData.resData.phoneNo }).then((respData) => {
                                // console.log(respData.resData);
                                if (respData.resData == "No") {
                                    console.log('first otp');
                                    setBasicUserData({ fbId: id, key: 'jwtToken', value: jwt.sign({ data: 'BankingBot' }, 'secret', { expiresIn: 3 * 60 }) }).then((respData) => {
                                        loginSuccessMessage(id, "Your verification code is verified. How can I help you today?");
                                    })
                                } else if (respData.resData == "Yes") {
                                    console.log('not first otp');
                                    setTimeout(() => {
                                        setBasicUserData({ fbId: id, key: 'jwtToken', value: jwt.sign({ data: 'BankingBot' }, 'secret', { expiresIn: 3 * 60 }) }).then((respData) => {
                                            //console.log(token)
                                            console.log('setBasic User Data');
                                            // console.log(respData.resData);
                                            afterOtpProcessFun(respBasicData.resData.afterOtpProcess, respBasicData.resData.phoneNo);
                                            setBasicUserData({ fbId: id, key: 'afterOtpProcess', value: {} }).then((respData) => {
                                                console.log('setBasic User Data');
                                                // console.log(respData.resData);
                                                falseTFA({ phoneNo: respBasicData.resData.phoneNo }).then((respData) => {
                                                    console.log(respData);
                                                })
                                            })
                                        }, 1000);
                                        console.log('this is after process');
                                    })
                                }
                                //  messageLocal=afterOtpProcess;
                            })
                        } else if (respData.resData == 2) {
                            console.log("Missed the mandatory parameter")
                            loginSuccessMessage(id, "You have entered wrong Verification code. Please try again!");
                        } else if (respData.resData == 6) {
                            console.log('verification code has been expired');
                            loginSuccessMessage(id, "Server is busy now, please try again after sometime");
                        } else if (respData.resData == 16) {
                            console.log('Invalid verification code');
                            loginSuccessMessage(id, "That is an invalid verification code, please try again!");
                        } else if (respData.resData == 17) {
                            TFACancel({ requestId: respBasicData.resData.requestId }).then((respData) => {
                                loginSuccessMessage(id, "No of wrong attempts reached, your account is locked out for 5 min from now.");
                            })
                        } else {
                            loginSuccessMessage(id, "Server is busy now, please try again after " + respData.resData + " minutes");

                        }
                    });
                });
            }
        });
        var creditDebitCardVal = {
            creditCard: "credit card",
            debitCard: "debit card",
            Savings: "savings",
            Checking: "checking"
        }

        function afterOtpProcessFun(messageLocal, phoneNo) {
            if (Object.keys(messageLocal).length == 0) {
                console.log('this is first process');
            }
            else if (messageLocal.data.function == 'checkBal') {
                console.log('this is check balence');
                balCheckFun({ accType: messageLocal.data.accType, phoneNo: phoneNo }).then((respData) => {
                    console.log(respData.resData);
                    loginSuccessMessage(id, "Account balance in " + creditDebitCardVal[messageLocal.data.accType] + " is " + numeral(respData.resData).format('$0,0.00'));
                })
            } else if (messageLocal.data.function == 'lostcard') {
                console.log('this is lost card');
                lostCardFun({ phoneNo: phoneNo, cardType: messageLocal.data.cardType }).then((respData) => {
                    console.log(respData);
                    if (respData.resData == 'Done') {
                        var buttons = [];
                        var buttonValues = ['Yes', 'No']
                        for (let i = 0; i < buttonValues.length; i++) {
                            buttons.push({
                                "type": "postback",
                                "title": buttonValues[i],
                                "payload": buttonValues[i]
                            });
                            if (i == buttonValues.length - 1) {
                                buttonSend(id, "Your " + creditDebitCardVal[messageLocal.data.cardType] + " has been deactivated. Do you want me to order a new " + creditDebitCardVal[messageLocal.data.cardType] + "?", buttons);
                            }
                        }
                    } else if (respData.resData == "Already Reported") {
                        loginSuccessMessage(id, "Your " + creditDebitCardVal[messageLocal.data.cardType] + " is already reported as lost. Do you want me to do anything else?");
                    }
                })
            } else if (messageLocal.data.function == "lostcardConfirm") {
                var buttons = [];
                for (let i = 0; i < messageLocal.ButtonValues.length; i++) {
                    buttons.push({
                        "type": "postback",
                        "title": messageLocal.ButtonNames[i],
                        "payload": messageLocal.ButtonValues[i]
                    });
                    if (i == messageLocal.ButtonValues.length - 1) {
                        buttonSend(id, "Please confirm that you would like to deactivate the " + creditDebitCardVal[messageLocal.data.cardType], buttons);
                    }
                }
            } else if (messageLocal.data.function == "newCard") {
                newCardFun({ phoneNo: phoneNo }).then((respData) => {
                    console.log(respData.resData);
                    var buttons = [];
                    for (let i = 0; i < messageLocal.ButtonValues.length; i++) {
                        buttons.push({
                            "type": "postback",
                            "title": messageLocal.ButtonNames[i],
                            "payload": messageLocal.ButtonValues[i]
                        });
                        if (i == messageLocal.ButtonValues.length - 1) {
                            buttonSend(id, "Would you like me to send the new card to current address " + respData.resData, buttons);
                        }
                    }
                })
            } else if (messageLocal.data.function == "changeAddress") {
                updateAddress({ phoneNo: phoneNo, address: messageLocal.data.address }).then((respData) => {
                    console.log(respData.resData);
                    loginSuccessMessage(id, "Thank you, you will receive your new card within 5 business days");
                })

            } else if (messageLocal.data.function == 'payOff') {
                checkPayCreditBalFun({ phoneNo: phoneNo }).then((respData) => {
                    console.log(respData.resData);
                    if (respData.resData.status == 'noBal') {
                        loginSuccessMessage(id, "You don't have any due on your credit card. Your current credit card limit is " + numeral(respData.resData.toUse).format('$0,0.00') + ".");
                    } else {
                        var buttons = [];
                        for (let i = 0; i < messageLocal.ButtonValues.length; i++) {
                            buttons.push({
                                "type": "postback",
                                "title": messageLocal.ButtonNames[i],
                                "payload": messageLocal.ButtonValues[i]
                            });
                            if (i == messageLocal.ButtonValues.length - 1) {
                                var dateNow = new Date();
                                buttonSend(id, "Your current due is " + numeral(respData.resData.toPay).format('$0,0.00') + " on your credit card which is payable by 27th of May. Do you like to make the payment?", buttons);
                            }
                        }
                    }
                })
            } else if (messageLocal.data.function == 'confirmCreditPay') {
                payCreditBalFun({ phoneNo: phoneNo, cardType: messageLocal.data.accType }).then((respData) => {
                    //console.log(respData.resData);
                    if (respData.resData == 'lessMoney') {
                        loginSuccessMessage(id, "You don't have enough money to make this transaction successful. Do you want me to do anything else?");
                    } else if (respData.resData == 'Done') {
                        loginSuccessMessage(id, "Your transaction was done. Do you want me to do anything else?");
                    } else if (respData.resData == 'Error') {
                        loginSuccessMessage(id, "Currently our server is busy, please try again later!");
                    }
                })
            } else if (messageLocal.data.function == 'cardStatement') {
                console.log('this is card statement')
                loginSuccessMessage(id, "Sure, please check the " + creditDebitCardVal[messageLocal.data.cardType] + " statement attached.")
                statementSend(id, messageLocal.data.message)

            } else if (messageLocal.data.function == "fundsTransfer") {
                fundsToInnerAccFun({ phoneNo: phoneNo, from: messageLocal.data.accType.split('to')[0].trim(), to: messageLocal.data.accType.split('to')[1].trim(), amount: messageLocal.data.amount }).then((respData) => {
                    //console.log(respData.resData);
                    if (respData.resData.status == 'Insufficient') {
                        loginSuccessMessage(id, "Sorry, your account balance is insufficient. Do you want me to do anything else?");
                    } else if (respData.resData.status == 'error') {
                        loginSuccessMessage(id, "Sorry, our server is busy. Please try again!");
                    } else
                        loginSuccessMessage(id, "Your transaction was success. Your current " + messageLocal.data.accType.split('to')[0].trim() + " balance is " + numeral(respData.resData[messageLocal.data.accType.split('to')[0].trim()]).format('$0,0.00') + " and " + messageLocal.data.accType.split('to')[1].trim() + " balance is " + numeral(respData.resData[messageLocal.data.accType.split('to')[1].trim()]).format('$0,0.00'));
                })
            } else if (messageLocal.data.function == "otherAmount") {
                transferMoneyToOther({ phoneNo: phoneNo, amount: messageLocal.data.amount, otherPhoneNo: messageLocal.data.number }).then((respData) => {
                    //console.log(respData.resData);
                    if (respData.resData == "notEnoughBal") {
                        loginSuccessMessage(id, "Sorry, you don't have enough balance to transfer money. Do you want me to do anything else?")
                    } else if (respData.resData == "error") {
                        loginSuccessMessage(id, "Sorry, server is busy now, please try again!")

                    } else if (respData.resData.status == "success") {
                        loginSuccessMessage(id, numeral(messageLocal.data.amount).format('$0,0.00') + " has been transferd to " + messageLocal.data.number + ". Your current checking balance is " + numeral(respData.resData.CheckingBal).format('$0,0.00'));
                        loginSuccessMessage(id, "Do you want me to do anything else?")
                        otherUserFbId({ phoneNo: messageLocal.data.number }).then((respData) => {
                            //console.log(respData.resData);
                            if (respData.resData.facebookId !== '') {
                                loginSuccessMessage(respData.resData.facebookId, "You have received " + numeral(messageLocal.data.amount).format('$0,0.00') + " from " + phoneNo);
                            } else {
                                console.log('user FacbookId is not available');
                            }
                        })
                    }
                })
            }
        }
    }
}

function userInfo(id)
{
	 return new Promise(function(resolve,reject){
  request('https://graph.facebook.com/v3.2/' + id + '?fields=id,email,first_name,last_name,profile_pic&access_token=EAAE0pZBFEZCDQBAAkdtliYnjjua0W44XscD6gXzOySdXwD4Gg69ZCZAbmnfQ16vO60ZAB0viM3z108mAZBvWIy3Y6d558At6OnZCXq9bif9Wu4B3bRf2ZBaYEp79Uaj2ZBo1OB4tz2mgcQMqwJaLs7rWv3yaaGwwYHO8l69UhRuhZA7ZAeZB6ZCu3ANxi',
    async function (err, response, body) {
		if(err)
		{
			reject({"error":err})
		}
		else
		{
              var res = JSON.parse(body)
              console.log("fb userData",res);
			resolve({"first_name":res.first_name,"last_name":res.last_name})
		}
    })

});
}




//card statement for facebook
function statementSend(id, text) {

    var dataPost = {
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: { access_token: process.env.Facebook_Token },
        method: 'POST',
        json: {
            recipient: { id: id },
            message: {
                text: text,
                attachment: {
                    type: 'file',
                    payload: {
                        url: 'https://6d451f60.ngrok.io/CardStatement',
                        is_reusable: true
                    }
                }
            }
        }
    }
    requestFun(dataPost)
}

//function to send responses with buttons to facebook
function buttonSend(id, text, button) {

    var dataPost = {
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: { access_token: process.env.Facebook_Token },
        method: 'POST',
        json: {
            recipient: { id: id },
            message: {
                attachment: {
                    type: "template",
                    payload: {
                        template_type: "button",
                        text: text,
                        buttons: button
                    }
                }
            }
        }
    };
    requestFun(dataPost)
}

//server listening
app.listen((process.env.PORT || 7007), () => {
    console.log('running on port ' + (process.env.PORT || 7007));
    //  console.log("port");
})