'use strict';

require('dotenv').config();

const express = require('express'); //app server
const app = express();
const request = require('request'); //request module to make http requests
const bodyParser = require('body-parser'); // parser for post requests
const Conversation = require('watson-developer-cloud/conversation/v1'); // watson sdk, using only conversation service
const ToneAnalyzerV3 = require('ibm-watson/tone-analyzer/v3');
const crypto = require("crypto");
var path = require('path');
//var bodyParser = require('body-parser');
var http = require('http').Server(app);
var io = require('socket.io')(http)
//cloud functions
const insightsModule = require('./CloudFunctions/insightsModule');
const FbIdCheck = require('./CloudFunctions/FbIdCheck');
const FbIdAdd = require('./CloudFunctions/FbIdAdd');
const TFARegister = require('./CloudFunctions/TFARegister');
const TFACheck = require('./CloudFunctions/TFACheck');
const getBasicUserData = require('./CloudFunctions/getBasicUserData');
const setBasicUserData = require('./CloudFunctions/setBasicUserData');
//const falseTFA = require('./CloudFunctions/falseTFA');
const TFACancel = require('./CloudFunctions/TFACancel');
const listAllusers = require('./CloudFunctions/listAllusers');
const FbUserCheck = require('./CloudFunctions/fbUserCheck');
const setBasicUserData1 = require('./CloudFunctions/p_setBasicUserData');
const fbUserAdd = require('./CloudFunctions/fbUserAdd');
const getDetails = require('./Database/getData');
const updateDetails = require('./Database/updateData');
const homes = require('./Database/homes');
const retailer = require('./Database/retailer')
const communities = require('./Database/communities')
const updateUserDetails = require('./CloudFunctions/updateUserDetails');
const getBasicUserData1 = require('./CloudFunctions/p_getBasicData');

const deleteAllDocuments = require('./CloudFunctions/deleteAllCollections');
const sendEmail = require('./CloudFunctions/sendEmail')
const updateEmail = require('./CloudFunctions/updateEmail');
const findEmail = require('./CloudFunctions/findEmail');
const updateContext = require('./CloudFunctions/updateContext');
const enableBot = require('./CloudFunctions/enableBot');
const updateAgentChat = require('./CloudFunctions/updateAgentChat');
const updateUserChat = require('./CloudFunctions/updateUserChat');
var rp = require('request-promise');
var NexmoRequestId;
// server  express config
var userlist = [], j;
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(__dirname + '/Login'));

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, content-type, Accept");
    next();
});
var totalConversation = [];
app.get('/test', (req, res) => {
    console.log(" This is Sample API");
    res.send("This is Sample API");
})
var insightPrototype = new insightsModule();
function insightUserRequestFunction(basicDetails) {
    console.log(basicDetails);
    var requestMessage = {};
    var conversationId = "12341234";
    if (basicDetails.contextId != undefined) {
        conversationId = basicDetails.contextId.conversation_id;
    }

    totalConversation = {
        'from': "USER",
        'text': basicDetails.text,
        'type': "USER",
        'date': new Date().getTime()
    }
    updateUserChat({ "fbId": basicDetails.fbId, "conversationid": conversationId, "conversation": totalConversation }).then(() => {
        // This is clokam account.
        userInfo(basicDetails.fbId).then((info) => {
            requestMessage.message =

                {
                    "email": "default-user",
                    "user": {
                        id: (info.first_name + info.last_name).toLowerCase() + "@gmail.com",
                        name: info.first_name
                    },
                    "type": "message",
                    "origin": "User",
                    "recipient": "Bot",
                    "text": basicDetails.text,
                    "channel": "FaceBook",
                    "timestamp": "2019-04-29T18:12:50.231Z",
                    "conversationID": conversationId,
                    "id": crypto.randomBytes(8).toString("hex"),
                    "intent": basicDetails.intent
                }
            console.log("requestMessage.message", requestMessage.message);
            insightPrototype.logMessage(requestMessage);
        })
    })
}

function insightBotResponseFunction(basicDetails) {
    var conversationId = "12341234";
    if (basicDetails.resData.contextId != undefined) {
        conversationId = basicDetails.resData.contextId.conversation_id;
    }

    totalConversation = {
        'from': "USER",
        'text': basicDetails.text,
        'type': "Agent",
        'date': new Date().getTime(),
    }
    updateUserChat({ "fbId": basicDetails.id, "conversationid": conversationId, "conversation": totalConversation }).then(() => {

        userInfo(basicDetails.id).then((info) => {
            var responseMessage = {}

            responseMessage =

                {
                    "email": "default-user",
                    "user": {
                        id: (info.first_name + info.last_name).toLowerCase() + "@gmail.com",
                        name: info.first_name
                    },
                    "type": "message",
                    "origin": "User",
                    "recipient": "Bot",
                    "text": basicDetails.text,
                    "channel": "FaceBook",
                    "timestamp": "2019-04-29T18:12:50.231Z",
                    "conversationID": conversationId,
                    "id": crypto.randomBytes(8).toString("hex")
                    //  "intent": "intent_Greeting"
                }
            insightPrototype.logMessage(responseMessage);
        })
    });





}
//watson bot object
var conversation = new Conversation({
    url: "https://gateway.watsonplatform.net/assistant/api",

    username: process.env.Watson_User_Name,

    password: process.env.Watson_User_Password,
    version: 'v1',
    version_date: '2018-03-03'
});

app.get('/fblogin', (req, res) => {
    res.sendFile(__dirname + '/Login/login.html');
});

app.get('/deleteAllDocuments', (req, res) => {
    console.log("delete all documents");
    deleteAllDocuments().then(resData => {
        console.log(resData);
        res.send('success');
    })

})
app.post('/endchat', (req, res) => {

    console.log("inside endChat", req.body);
    enableBot({ "fbId": req.body[0].fbId }).then(() => {

        console.log("req.body[0].fbId", req.body[0].fbId);
        console.log("req.body[0]", req.body[0]);
        updateAgentChat({ "fbId": req.body[0].fbId, "conversationid": req.body[0].conversationid, "conversation": req.body[0].conversation }).then(() => {
            console.log(" Agent DB updated");

        })

    })
    res.json({ "msg": "bot is enabled" });

})

app.get('/webhook/', (req, res) => {
    console.log('get webhook');
    if (req.query['hub.verify_token'] === 'CustomerBot') {
        res.send(req.query['hub.challenge']);
    } else
        res.send('Error when we try to validating your token.');
});
app.get('/', (req, res) => {
    console.log('get webhook');
    check(req, res)
});
function check(req, res) {
    res.send('Error when we try to validating your token.');
}
app.post('/webhook/', (req, res) => {
    //   console.log(req.body.entry[0].id)

    res.sendStatus(200);
    console.log('this is post request');
    //console.log(JSON.stringify(req.body));
    
    for (let i = 0; i < req.body.entry[0].messaging.length; i++) {
        console.log("req.body.entry[0].messaging", req.body.entry[0].messaging);
        j = userlist.findIndex(value => value.fbId === req.body.entry[0].messaging[i].sender.id)

        console.log(i)
        if (j == -1) {
            userlist.push({
                'fbId': req.body.entry[0].messaging[i].sender.id,
                'count': 0
            })
        }
        FbUserCheck({ fbId: req.body.entry[0].messaging[i].sender.id }).then((respData) => {
            console.log("respData", respData);
            if (respData.resData.docs.length == 0) {
                console.log("inside length==0");
                fbUserAdd({ fbId: req.body.entry[0].messaging[i].sender.id }).then((respBasicData) => {
                    console.log("respBasicData", respBasicData);
                    console.log('no context');
                    conversation.message({ workspace_id: process.env.Watson_Workspace }, function (err, res) {
                        if (err) {
                            console.log('error:', err);
                        }
                        else {
                            if (res.context.isAgentOn == false) {
                                setBasicUserData1({ fbId: req.body.entry[0].messaging[i].sender.id, key: 'contextId', value: res.context }).then((respData) => {
                                    if (req.body.entry[0].messaging[i].message) {
                                        respBasicData.text = req.body.entry[0].messaging[i].message.text;
                                        respBasicData.fbId = req.body.entry[0].messaging[i].sender.id;
                                        // insightUserRequestFunction(respBasicData)
                                        loginSuccessMessage(req.body.entry[0].messaging[i].sender.id, "Hello, I’m your Builder bot. Before we get started, can you answer a few questions about yourself");
                                        // setTimeout(() => {
                                        //     loginSuccessMessage(req.body.entry[0].messaging[i].sender.id, "Before we get started, can you answer a few questions about yourself")
                                        // }, 3000);

                                        watsonRequest("new User", req.body.entry[0].messaging[i].sender.id);
                                    }
                                    else if (req.body.entry[0].messaging[i].postback) {
                                        respBasicData.text = req.body.entry[0].messaging[i].postback.payload;
                                        respBasicData.fbId = req.body.entry[0].messaging[i].sender.id;
                                        //  insightUserRequestFunction(respBasicData)
                                        loginSuccessMessage(req.body.entry[0].messaging[i].sender.id, "Hello, I’m your Builder bot. You can ask me about plans, services and more!")
                                        setTimeout(() => {
                                            loginSuccessMessage(req.body.entry[0].messaging[i].sender.id, "Before we get started, can you answer a few questions about yourself")
                                        }, 3000);
                                        watsonRequest("new User", req.body.entry[0].messaging[i].sender.id);
                                    }

                                })

                            }
                            else {

                                console.log("Need to start socket implementation");
                                var fbid = req.body.entry[0].messaging[i].sender.id
                                var msg = req.body.entry[0].messaging[i].message
                                socketImplementation(fbid, msg, res.context.conversation_id, res.context.Email, res.context.Ph_number)


                            }

                        }
                    });
                })

            }
            else if (respData.resData.docs.length > 0) {
                //                        phoneNo=respData.resData.docs[0].PhoneNo;
                getBasicUserData({ fbId: req.body.entry[0].messaging[i].sender.id }).then((respBasicData) => {
                    console.log('inside get basic user data', respBasicData);

                    if (respBasicData.resData.contextId != "") {
                        if (respBasicData.resData.contextId.isAgentOn == false) {
                            console.log('context available');
                            if (req.body.entry[0].messaging[i].message) {
                                respBasicData.text = req.body.entry[0].messaging[i].message.text;
                                respBasicData.fbId = req.body.entry[0].messaging[i].sender.id;
                                //  insightUserRequestFunction(respBasicData)
                                watsonRequest(req.body.entry[0].messaging[i].message.text, req.body.entry[0].messaging[i].sender.id);
                            }

                            else if (req.body.entry[0].messaging[i].postback) {
                                respBasicData.text = req.body.entry[0].messaging[i].postback.payload;
                                respBasicData.fbId = req.body.entry[0].messaging[i].sender.id;
                                //  insightUserRequestFunction(respBasicData)
                                watsonRequest(req.body.entry[0].messaging[i].postback.payload, req.body.entry[0].messaging[i].sender.id);
                            }

                        }
                        else {
                            console.log("Need to implements sockets");
                            var fbid = req.body.entry[0].messaging[i].sender.id
                            var msg = req.body.entry[0].messaging[i].message
                            //   respBasicData.resData.contextId.conversation_id='12345'
                            socketImplementation(fbid, msg, respBasicData.resData.contextId.conversation_id, respBasicData.resData.contextId.Email, respBasicData.resData.contextId.Ph_number)


                        }

                    } else {
                        console.log('no context');
                        conversation.message({ workspace_id: process.env.Watson_Workspace }, function (err, res) {
                            if (err) {
                                console.log('error:', err);
                            }
                            else {
                                if (res.context.isAgentOn == false) {
                                    setBasicUserData({ fbId: req.body.entry[0].messaging[i].sender.id, key: 'contextId', value: res.context }).then((respData) => {
                                        console.log('setBasic User Data');
                                        //console.log(respData.resData);
                                        if (req.body.entry[0].messaging[i].message) {
                                            respBasicData.text = req.body.entry[0].messaging[i].message.text;
                                            respBasicData.fbId = req.body.entry[0].messaging[i].sender.id;

                                            watsonRequest(req.body.entry[0].messaging[i].message.text, req.body.entry[0].messaging[i].sender.id);
                                        }
                                        else if (req.body.entry[0].messaging[i].postback) {
                                            respBasicData.text = req.body.entry[0].messaging[i].postback.payload;
                                            respBasicData.fbId = req.body.entry[0].messaging[i].sender.id;
                                            //   insightUserRequestFunction(respBasicData)
                                            watsonRequest(req.body.entry[0].messaging[i].postback.payload, req.body.entry[0].messaging[i].sender.id);
                                        }

                                    })
                                }
                                else {
                                    var fbid = req.body.entry[0].messaging[i].sender.id
                                    var msg = req.body.entry[0].messaging[i].message
                                    socketImplementation(fbid, msg, res.context.conversation_id, res.context.Email, res.context.Ph_number)


                                }

                            }
                        });
                    }
                })
            }
        });


    }
});
app.get('/feedback', (req, res) => {
    // var fbUsers=["2694124463950281","2271641979621103"];
    listAllusers().then((response) => {
        response.resData.forEach(element => {
            if (element.fbId != "") {
                //console.log("IF");
                //  loginSuccessMessage(element.fbId, "60% off on all Jordans!");
                buttonSend3(element.fbId, "Thank you for visiting our store! Would you like to take part in a quick survey?")
                res.send('success')
                // notifications(element.fbId);
            }
            else {
                //console.log("ELSE");
                res.send("failed");
            }

        });

    })

});

function userInfo(id) {
    return new Promise(function (resolve, reject) {
        request('https://graph.facebook.com/v3.2/' + id + '?fields=id,email,first_name,last_name,profile_pic&access_token=EAAJNKHeA1doBAMaoJFD5uydFsz7UJc6l0jRTctWEvLUHEdLZApFLU9ES14DNRFS00veuR9G8Qj8MkyMRB7vZBPltDSWvz4VEbuI07LMpGwEZCldhoEbYybm4Ar1I2FUZBYqq7UK7yO6Kml4tiN1yfknCZC3ExfBYZBxrYWdK8FNgZDZD',
            function (err, response, body) {
                if (err) {
                    reject({ "error": err })
                }
                else {
                    var res = JSON.parse(body)
                    console.log("fb userData", res);
                    resolve({ "first_name": res.first_name, "last_name": res.last_name })
                }
            })

    });
}
app.get('/proactiveMessages', (req, res) => {
    // var fbUsers=["2694124463950281","2271641979621103"];
    // var data="10 25 12  12ext" replace /([^(\d+)])/ with "";
    var data = req.query.message.trim();
    listAllusers().then((response) => {
        response.resData.forEach(element => {
            if (element.fbId != "") {
                //console.log("IF");
                loginSuccessMessage(element.fbId, data);
                notifications(element.fbId);
                res.send('success')

            }
            else {
                //console.log("ELSE");
                res.send("failed");
            }
        });
    })
})
app.post('/checkCredentials', (req, res) => {
    //console.log('check credentials');
    //console.log("req.body.href", req.body.href);
    FbIdCheck({ fbId: req.body.href }).then((respData) => {
        console.log("respData.resData.docs", respData.resData.docs.length);
        if (respData.resData == 'error') {
            //console.log('error occured');
            res.send('error');
            loginSend(req.body.entry[0].messaging[i].sender.id, "Sorry, something went wrong. Please login again!");
        } else if (respData.resData.docs.length > 0) {
            // //console.log('user available');
            // res.send({ key: 'available', value: "You are already logged in!" });
            // loginSuccessMessage(req.body.href, "Hey, you are already logged in! Continue your chat.")
            TFARegister({ phoneNo: respData.resData.docs[0].phoneNo }).then((respData) => {
                //console.log('checking req.body.href', req.body.href);
                console.log("respData",respData);
                if (respData.resData.result.status == 0) {
                    console.log("inside status")
                    NexmoRequestId = respData.resData.result.request_id;
                    setBasicUserData({ fbId: req.body.href, key: 'requestId', value: respData.resData.result.request_id }).then((respData) => {
                        //console.log('setBasic User Data');
                    loginSuccessMessage(req.body.href, "You are successfully logged in! You will get a verification code to your mobile. Please enter the verification code")
                        //  buttonSend1(id)
                    })
                } else if (respData.resData.result.status == 3) {
                    //console.log("invalid phone number")
                    loginSuccessMessage(req.body.href, "Your registered phone number doesn't exist. Please check the number and try again!");
                } else if (respData.resData.result.status == 9) {
                    //console.log("Your nexmo account does not have sufficient credit to process this request")
                    loginSuccessMessage(req.body.href, "Our server is busy now. Please try again!");
                } else if (respData.resData.result.status == 10) {
                    //console.log("Concurrent verifications to the same number are not allowed")
                    loginSuccessMessage(req.body.href, "Our server is busy now. Please try again after 10 minutes");
                } else if (respData.resData.result.status == 15) {
                    //console.log("The destination number is not in a supported network")
                    loginSuccessMessage(req.body.href, "Please check your registered phone number and try again!");
                } else {
                    loginSuccessMessage(req.body.href, "Our server is busy now. Please try again after some time")
                }

                res.send({ key: 'success', value: "You are successfully logged in!" });

            })
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
                    //console.log('added success');
                    TFARegister({ phoneNo: respData.resData.phoneNo }).then((respData) => {
                        if (respData.resData.result.status == 0) {
                            NexmoRequestId = respData.resData.result.request_id;
                            setBasicUserData({ fbId: req.body.href, key: 'requestId', value: respData.resData.result.request_id }).then((respData) => {
                                //console.log('setBasic User Data');
                                loginSuccessMessage(req.body.href, "You are successfully logged in! You will get a verification code to your mobile. Please enter the verification code.")

                            })
                        } else if (respData.resData.result.status == 3) {
                            //console.log("invalid phone number")
                            loginSuccessMessage(req.body.href, "Your registered phone number doesn't exist. Please check the number and try again!");
                        } else if (respData.resData.result.status == 9) {
                            //console.log("Your nexmo account does not have sufficient credit to process this request")
                            loginSuccessMessage(req.body.href, "Our server is busy now. Please try again!");
                        } else if (respData.resData.result.status == 10) {
                            //console.log("Concurrent verifications to the same number are not allowed")
                            loginSuccessMessage(req.body.href, "Our server is busy now. Please try again after 5 minutes");
                        } else if (respData.resData.result.status == 15) {
                            //console.log("The destination number is not in a supported network")
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
                    //console.log('added/data not matched');
                    res.send({ key: 'error', value: "Server is busy, please try again!" });
                }
            })
        }
    })
})
function socketImplementation(fbid, msg, conversationID, email, phno) {
    console.log("conversationID", conversationID);
    console.log("inside socketsimp")
    var options = {
        method: 'POST',
        uri: 'https://agentbackend.herokuapp.com/getRequest',
        body: {
            "fbId": fbid,
            "msg": msg.text,
            "conversationId": conversationID,
            "email": email,
            "phno": phno
        },
        json: true // Automatically stringifies the body to JSON
    };

    rp(options)
        .then(function (parsedBody) {
            console.log("parsedBody", parsedBody);
        })
        .catch(function (err) {
            console.log("error", err);
            if (err.statusCode == 404) {
                loginSuccessMessage(fbid, "No Agents are available at this moment");
                enableBot({ "fbId": fbid }).then(() => {
                    console.log("bot enabled");
                });
            }
            else
            {
                loginSuccessMessage(fbid, "No Agents are available at this moment");
                enableBot({ "fbId": fbid }).then(() => {
                    console.log("bot enabled");
                });
            }
        });

}

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
                        url: "https://images.unsplash.com/photo-1556742504-16b083241fab?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=2250&q=80 ",
                        is_reusable: true
                    }
                }
            }
        }
    };
    requestFun(dataPost)
}
function loginSuccessMessage(id, text) {

    getBasicUserData({ fbId: id }).then((getResponse) => {
        getResponse.text = text;
        getResponse.id = id
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
function loginSuccessMessage1(id) {

    getBasicUserData({ fbId: id }).then((getResponse) => {
        // getResponse.text = text;
        getResponse.id = id
        insightBotResponseFunction(getResponse);
    })
    var dataPost = {
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: { access_token: process.env.Facebook_Token },
        method: 'POST',
        json: {
            recipient: { id: id },
            message: {
                attachment : {
                    type : "video",
                    payload :{
                        url:'https://d2v9y0dukr6mq2.cloudfront.net/video/preview/pbJRSBz/videoblocks-virtual-reality-360-view-from-the-city-noto-in-italy_S6K5L_vTZ__WM.mp4',                        
                    }
                }              
            }
        }
    };
    requestFun(dataPost)
}


function buttonSend4(id, message) {

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
                        text: message,
                        buttons:
                            [
                                {
                                    "type": "postback",
                                    "title": "Yes",
                                    "payload": "Connect with an agent"
                                },
                                {
                                    "type": "postback",
                                    "title": "No",
                                    "payload": "No"
                                }
                            ]
                    }
                }
            }
        }
    };
    requestFun(dataPost)
}
//
function buttonSend3(id, message) {

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
                        text: message,
                        buttons:
                            [
                                {
                                    "type": "postback",
                                    "title": "Yes",
                                    "payload": "yes"
                                },
                                {
                                    "type": "postback",
                                    "title": "No",
                                    "payload": "No"
                                }
                            ]
                    }
                }
            }
        }
    };
    requestFun(dataPost)
}


function buttonSend2(id, message) {

    var ButtonValues = ["Find a Home", "Find a Retailer ", "Find a Community"]
    var buttonsAppendText = message;
    var buttons = [];
    for (var i = 0; i < ButtonValues.length; i++) {
        buttons.push({
            "type": "postback",
            "title": ButtonValues[i],
            "payload": ButtonValues[i]
        });
        buttonsAppendText = buttonsAppendText + " -> " + ButtonValues[i];
        if (i == ButtonValues.length - 1) {
            getBasicUserData({ fbId: id }).then((getResponse) => {
                getResponse.text = buttonsAppendText;
                getResponse.id = id
                insightBotResponseFunction(getResponse);
            })
        }

    }

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
                        text: message,
                        buttons: buttons
                    }
                }
            }
        }
    };
    requestFun(dataPost)
}
//send buttons to facebook
function buttonSend1(id, message) {

    var ButtonValues = ["Production Supervisor", "Sales Coordinator", "Sr. Accountant"]

    //  var ButtonValues = ["Prepaid Data Add ons", "Postpaid Data Add ons", "Favourite Country"]
    var buttonsAppendText = message;
    var buttons = [];
    for (var i = 0; i < ButtonValues.length; i++) {
        buttons.push({
            "type": "postback",
            "title": ButtonValues[i],
            "payload": ButtonValues[i]
        });
        buttonsAppendText = buttonsAppendText + " -> " + ButtonValues[i];
        if (i == ButtonValues.length - 1) {
            getBasicUserData({ fbId: id }).then((getResponse) => {
                getResponse.text = buttonsAppendText;
                getResponse.id = id
                insightBotResponseFunction(getResponse);
            })
        }

    }

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
                        text: message,
                        buttons: buttons
                    }
                }
            }
        }
    };
    requestFun(dataPost)
}
//send buttons to facebook
function buttonSend(id, data) {
    //console.log("data in button send", data);
    //console.log("button values", data.ButtonValues);
    var buttonsAppendText = data.message;
    var buttons = [];
    for (var i = 0; i < data.ButtonValues.length; i++) {
        buttons.push({
            "type": "postback",
            "title": data.ButtonValues[i],
            "payload": data.ButtonValues[i]
        });
        buttonsAppendText = buttonsAppendText + " -> " + data.ButtonValues[i];
        if (i == data.ButtonValues.length - 1) {
            getBasicUserData({ fbId: id }).then((getResponse) => {
                getResponse.text = buttonsAppendText;
                insightBotResponseFunction(getResponse);
            })
        }
    }



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
                        text: data.message,
                        buttons: buttons
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
                                "url": "https://builder-bot-miracle.herokuapp.com/fblogin?id=" + id,
                            }
                        ]
                    }
                }
            }
        }
    };
    requestFun(dataPost)
}

function loginSend1(id, text) {

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
                                 "type":"web_url",
                            "url":"www.miraclesoft.com",
                            "title":"More Details"
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
function broadBandCards(id, data) {
    //console.log("data in sendCards", data);
    var dataPost = {
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: { access_token: process.env.Facebook_Token },
        method: 'POST',
        json: {
            recipient: { id: id },
            message: {
                attachment: {
                    type: "template",
                    "payload": {
                        "template_type": "list",
                        "elements": [
                            {
                                "title": "Broadband plans",
                                // "color":"#FF0000",
                                "image_url": " http://www.sahyadigital.com/site_assets/theme/img/broadband.jpg",
                                //  "subtitle": "Tiempos: 9AM to 8PM",
                                // "default_action": {
                                //     "type": "web_url",
                                //     "url": "https://www.miraclesoft.com",
                                //     "webview_height_ratio": "tall",
                                // }
                            },
                            {
                                "title": data.ButtonValues[0],
                                // "color":"#FF0000",
                                // "image_url": "https://nikonrumors.com/wp-content/uploads/2014/03/Nikon-1-V3-sample-photo.jpg",
                                "subtitle": "Monthly rental BD 12 with 40 GB data and 12 Mbps speed.",
                                "default_action": {
                                    "type": "web_url",
                                    "url": "https://www.miraclesoft.com",
                                    "webview_height_ratio": "tall",
                                }

                            },
                            {
                                "title": data.ButtonValues[1],
                                // "color":"#FF0000",
                                //  "image_url": "https://nikonrumors.com/wp-content/uploads/2014/03/Nikon-1-V3-sample-photo.jpg",
                                "subtitle": "Monthly rental BD 15 with 140 GB data and Maximum 4G+ speed.",
                                "default_action": {
                                    "type": "web_url",
                                    "url": "https://www.miraclesoft.com",
                                    "webview_height_ratio": "tall",
                                }

                            },
                            {
                                "title": data.ButtonValues[2],
                                // "color":"#FF0000",
                                // "image_url": "https://nikonrumors.com/wp-content/uploads/2014/03/Nikon-1-V3-sample-photo.jpg",
                                "subtitle": "Monthly rental BD 20 with 200 GB data and Maximum 4G+ speed",
                                "default_action": {
                                    "type": "web_url",
                                    "url": "https://www.miraclesoft.com",
                                    "webview_height_ratio": "tall",
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

function sendCards1(id) {
    console.log("data in sendCards");
    var dataPost = {
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: { access_token: process.env.Facebook_Token },
        method: 'POST',
        json: {
            recipient: { id: id },
            message: {
                attachment: {
                    type: "template",
                    "payload": {
                        "template_type": "generic",
                        "elements": [
                            {
                                
                                // "color":"#FF0000",
                                "image_url": "https://lh3.googleusercontent.com/srsE0OKE9z1ICaYeP1cBrbEVaFSp5E691tPdV6vC0fLtaqpSsfSzIcFj8HQGlIeGaZM0MDlwJw6BQ8i3JRfUPlc7Bp1SDO1AAitirVoDIru6JQ3WStqFYJU-1Hfngn6PLb8pSoAUt5nLFmYkE-bAChWTSbDPypGMDocmjwEboXmqvfzZVxEe7O95FmIH6qjuPAm8ydnyRDcckXLYxYq08C0IHoaK15HF1mXkKnML7MjbuA8Cvx40A_ubQYqdu1491h8r7-UAwR9QgKf3v9kGo7d72A-HjiZLE26jKUhNzfmCpXlq2TWtLRKoOF8Ga0CDdDLrU3oflZbNI5LtT8DlhzMKTAlY-l-4DZ-9ZsgnjYG3uehjKBk0rHZ32e_LoZngdy72JdahYrg043oBO9zgU09XP3IbsDoP8VddedlpwrU_XuihFtkmMrC8O_uewmBFvfrc_MJprLPPd7nLfqplmKNsX71rZJa3hrbG0JteM5I0r883iJlh2YFJEzH6eNzB0HwxbnGjCwVra0E6NGKdWziNGxeRhIXxaqN5p4aJMOjXUptmDQBgjetdIVwPeE_Icz6MCnLcVsTYaV3C0DfGqN9Cvm0ifrLT17TxD4WQXUnExGO_UVlq2Yg7zFs0H2S9drihFrvYWgzLXjgJOcvMew=w1366-h625",
                                "title": "Miracle Builders",
                                "subtitle": "Miracle Software Systems, Inc \n 45625 Grand River Avenue \n  Novi MI(48374) USA \n www.miraclesoft.com",
                               // "text": "dfghjkl"
                            }
                        ]
                    }
                }
            }
        }
    };
    requestFun(dataPost)
}

function sendCards(id) {
    //console.log("data in sendCards", data);
    var dataPost = {
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: { access_token: process.env.Facebook_Token },
        method: 'POST',
        json: {
            recipient: { id: id },
            message: {
                attachment: {
                    type: "template",
                    "payload": {
                        "template_type": "generic",
                        "elements": [
                            // {
                            //     "title": "PostPaid palns",
                            //     // "color":"#FF0000",
                            //     "image_url": "https://cdn3.vectorstock.com/i/1000x1000/97/77/mobile-data-exchange-icon-colored-symbol-premium-vector-23579777.jpg",
                            //     "subtitle": "Telecommunications ",
                            // },
                            {
                                "title": "Gold Star 3280 201" ,
                                // "color":"#FF0000",
                                "image_url": "https://res.cloudinary.com/douaer6ci/image/fetch/s--Tr252nTA--/c_fill,f_auto,fl_any_format.progressive,h_225,q_auto,w_400/http://prd-champion-homes.s3.amazonaws.com/images/gold-star-3280-201-exterior.jpg",
                                "subtitle": "2305 Square Feet \n 4 Bedrooms \n 2 Bathrooms \n Multi-Section"

                            },
                            {
                                "title": "Barclay 7611",
                                // "color":"#FF0000",
                                "image_url": "https://res.cloudinary.com/douaer6ci/image/fetch/s--_vrn-ZIM--/c_fill,f_auto,fl_any_format.progressive,h_225,q_auto,w_400/http://prd-champion-homes.s3.amazonaws.com/images/barclay-7611-optional-7-12-roof-pitch-with-site-built-porch-by-other.jpg",
                              "subtitle": "2280 Square Feet \n 4 Bedrooms \n 2 Bathrooms \n Multi-Section",

                            },
                            {
                                "title": "Barclay 6445",
                                // "color":"#FF0000",
                                "image_url": "https://res.cloudinary.com/douaer6ci/image/fetch/s--308qPBkD--/c_fill,f_auto,fl_any_format.progressive,h_225,q_auto,w_400/http://prd-champion-homes.s3.amazonaws.com/images/barclay-6445-optional-7-12-roof-pitch-with-site-built-porch-garage-by-other.jpg",
                                "subtitle": "2220 Square Feet \n 3 Bedrooms \n 2 Bathrooms \n  Multi-Section",

                            }
                        ]
                    }
                }
            }
        }
    };
    requestFun(dataPost)
}


function sendCard(id) {
    //console.log("data in sendCards", data);
    var dataPost = {
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: { access_token: process.env.Facebook_Token },
        method: 'POST',
        json: {
            recipient: { id: id },
            message: {
                attachment: {
                    type: "template",
                    "payload": {
                        "template_type": "generic",
                        "elements": [
                        
                            {
                                "title": "Production Supervisor - New Construction" ,
                                "subtitle": "Jacobs Engineering Group Inc \n 1 week ago",
                                "buttons":
                                [
                                    {
                                        "type": "postback",
                                        "title": "Production Supervisor",
                                        "payload": "Production Supervisor"
                                    }
                                ]

                            },
                            {
                                "title": "Sales Coordinator",
                                // "color":"#FF0000",
                                //"image_url": "https://res.cloudinary.com/douaer6ci/image/fetch/s--_vrn-ZIM--/c_fill,f_auto,fl_any_format.progressive,h_225,q_auto,w_400/http://prd-champion-homes.s3.amazonaws.com/images/barclay-7611-optional-7-12-roof-pitch-with-site-built-porch-by-other.jpg",
                              "subtitle": "PCL Construction \n 5 days ago",
                              "buttons":
                              [
                                  {
                                      "type": "postback",
                                      "title": "Sales Coordinator",
                                      "payload": "Sales Coordinator"
                                  }
                              ]

                            },
                            {
                                "title": "Sr.Accountant",
                                // "color":"#FF0000",
                               // "image_url": "https://res.cloudinary.com/douaer6ci/image/fetch/s--308qPBkD--/c_fill,f_auto,fl_any_format.progressive,h_225,q_auto,w_400/http://prd-champion-homes.s3.amazonaws.com/images/barclay-6445-optional-7-12-roof-pitch-with-site-built-porch-garage-by-other.jpg",
                                "subtitle": "Wohlsen Construction Company \n 4 days ago",
                                "buttons":
                                [
                                    {
                                        "type": "postback",
                                        "title": "Accountant",
                                        "payload": "Accountant"
                                    }
                                ]

                            }
                        ]
                    }
                }
            }
        }
    };
    requestFun(dataPost)
}






function sendMaps(id,data){
    messageData = {
        "attachment": {
          "type": "template",
          "payload": {
            "template_type": "generic",
            "elements": [{
              "title": 'Location Shared By Bot',
              "subtitle": "Location Subtitle",
              "image_url": "https://www.google.com/maps/dir/Gudepuvalasa,+Andhra+Pradesh/42.259516,-83.544633/@1.8470671,-86.8398523,3z/data=!3m1!4b1!4m8!4m7!1m5!1m1!1s0x3a3bfc3aac92b32b:0xec2faa1b0e0dd5da!2m2!1d83.4936905!2d17.9952651!1m0",
              "default_action": {
                  "type": "web_url",
                  "url": "https://www.google.com/maps/dir/Gudepuvalasa,+Andhra+Pradesh/42.259516,-83.544633/@1.8470671,-86.8398523,3z/data=!3m1!4b1!4m8!4m7!1m5!1m1!1s0x3a3bfc3aac92b32b:0xec2faa1b0e0dd5da!2m2!1d83.4936905!2d17.9952651!1m0",
                  "messenger_extensions": true,
                  "webview_height_ratio": "tall"
                }
            }]
          }
        }
    }
}


function sendCards2(id, data1) {
    //console.log("data in sendCards", data);
let elements = [];

data1.forEach(dataElement => {
    elements.push({
        "title": dataElement.Name ,
        // "color":"#FF0000",
        "image_url": dataElement.image_url,
        "subtitle": dataElement.Squarefeet+ "\n"+ dataElement.Bedrooms + "\n" + dataElement.Bathrooms+"\n"+dataElement.Type

    })
});

    var dataPost = {
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: { access_token: process.env.Facebook_Token },
        method: 'POST',
        json: {
            recipient: { id: id },
            message: {
                attachment: {
                    type: "template",
                    "payload": {
                        "template_type": "generic",
                        "elements": elements
                    }
                }
            }
        }
    };
    requestFun(dataPost)
}

function sendCards3(id, data1) {
    //console.log("data in sendCards", data);
let elements = [];

data1.forEach(dataElement => {
    elements.push({
        "title":dataElement.Name ,
        // "color":"#FF0000",
        //"image_url": ,
        "subtitle": dataElement.address+ "\n"+ dataElement.phone+ "\n" + dataElement.Distance,
        "buttons":[
            {
              "type":"web_url",
              "url":dataElement.map,
              "title":"Get Directions"
            }
        ]
    })
});

    var dataPost = {
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: { access_token: process.env.Facebook_Token },
        method: 'POST',
        json: {
            recipient: { id: id },
            message: {
                attachment: {
                    type: "template",
                    "payload": {
                        "template_type": "generic",
                        "elements": elements
                    }
                }
            }
        }
    };
    requestFun(dataPost)
}

function sendCards4(id, data1) {
    //console.log("data in sendCards", data);
let elements = [];

data1.forEach(dataElement => {
    elements.push({
        "title":dataElement.Name ,
        // "color":"#FF0000",
        "image_url": dataElement.image ,
        "subtitle": dataElement.address+ "\n"+ dataElement.phone+ "\n" + dataElement.Distance,
        "buttons":[
            {
              "type":"web_url",
              "url":dataElement.map,
              "title":"Get Directions"
            }
        ]
    })
});

    var dataPost = {
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: { access_token: process.env.Facebook_Token },
        method: 'POST',
        json: {
            recipient: { id: id },
            message: {
                attachment: {
                    type: "template",
                    "payload": {
                        "template_type": "generic",
                        "elements": elements
                    }
                }
            }
        }
    };
    requestFun(dataPost)
}


function sendCards5(id) {
    //console.log("data in sendCards", data);
    var dataPost = {
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: { access_token: process.env.Facebook_Token },
        method: 'POST',
        json: {
            recipient: { id: id },
            message: {
                attachment: {
                    type: "template",
                    "payload": {
                        "template_type": "generic",
                        "elements": [
                            // {
                            //     "title": "PostPaid palns",
                            //     // "color":"#FF0000",
                            //     "image_url": "https://cdn3.vectorstock.com/i/1000x1000/97/77/mobile-data-exchange-icon-colored-symbol-premium-vector-23579777.jpg",
                            //     "subtitle": "Telecommunications ",
                            // },
                            {
                                "title": "Gold Star 3280 201" ,
                                // "color":"#FF0000",
                                "image_url": "https://res.cloudinary.com/douaer6ci/image/fetch/s--Tr252nTA--/c_fill,f_auto,fl_any_format.progressive,h_225,q_auto,w_400/http://prd-champion-homes.s3.amazonaws.com/images/gold-star-3280-201-exterior.jpg",
                                "subtitle": "2305 Square Feet \n 4 Bedrooms \n 2 Bathrooms \n Multi-Section",
                                "buttons":
                                [
                                    {
                                        "type": "postback",
                                        "title": "Gold Star 3280 201",
                                        "payload": "Gold Star"
                                    }
                                ]

                            },
                            {
                                "title": "Barclay 7611",
                                // "color":"#FF0000",
                                "image_url": "https://res.cloudinary.com/douaer6ci/image/fetch/s--_vrn-ZIM--/c_fill,f_auto,fl_any_format.progressive,h_225,q_auto,w_400/http://prd-champion-homes.s3.amazonaws.com/images/barclay-7611-optional-7-12-roof-pitch-with-site-built-porch-by-other.jpg",
                              "subtitle": "2280 Square Feet \n 4 Bedrooms \n 2 Bathrooms \n Multi-Section",
                              "buttons":
                              [
                                  {
                                      "type": "postback",
                                      "title": "Barclay 7611",
                                      "payload": "Barclay"
                                  }
                              ]

                            }
                        ]
                    }
                }
            }
        }
    };
    requestFun(dataPost)
}



//watson conversation
function watsonRequest(input, id) {
  
    getBasicUserData({ fbId: id }).then((respBasicData) => {
        //console.log("respBasicData", respBasicData);
        ////console.log(respBasicData.resData);
        var payload =
        {
            workspace_id: process.env.Watson_Workspace,
            input: { "text": input },
            context: respBasicData.resData.contextId
        }

        conversation.message(payload, function (err, responseMessage) {
            if (err) {
                console.log(err);
            }
            else {
                if (JSON.parse(responseMessage.intents.length != 0)) {
                    var data = {
                        "fbId": id,
                        "text": input,
                        "contextId": responseMessage.context,
                        "intent": responseMessage.intents[0].intent
                        
                    }
                } else {
                    var data = {
                        "fbId": id,
                        "text": input,
                        "contextId": responseMessage.context,
                        "intent": ""

                    }
                 
                }

                insightUserRequestFunction(data);
                console.log("responseMessage.output",responseMessage.output.text[0]);
                if (responseMessage.output.text[0].includes("action")) {
                    if (JSON.parse(responseMessage.output.text[0]).action == 'process') {
                        if (JSON.parse(responseMessage.output.text[0]).data.function == 'OTP') {
                            console.log("inside OTP function");
                            TFACheck({ requestId: NexmoRequestId, pin: input }).then((respData) => {
                                console.log("respData",respData)
                                if (respData.resData == 0) {
                                    //console.log('this is after process');
                                    //  loginSuccessMessage(id, "Sure, Please check out the most exciting add ons available in VIVA");
                                    loginSuccessMessage(id, " Here are the few options to upgrade")
                                    sendCards5(id) 

                                } else if (respData.resData == 2) {
                                    //console.log("Missed the mandatory parameter")
                                    loginSuccessMessage(id, "You have entered wrong Verification code. Please try again!");
                                } else if (respData.resData == 6) {
                                    //console.log('verification code has been expired');
                                    loginSuccessMessage(id, "Server is busy now, please try again after sometime");
                                } else if (respData.resData == 16) {
                                    //console.log('Invalid verification code');
                                    loginSuccessMessage(id, "That is an invalid verification code, please try again!");
                                } else if (respData.resData == 17) {
                                    TFACancel({ requestId: respBasicData.resData.requestId }).then((respData) => {
                                        loginSuccessMessage(id, "No of wrong attempts reached, your account is locked out for 5 min from now.");
                                    })
                                } else {
                                    loginSuccessMessage(id, "Server is busy now, please try again after " + respData.resData + " minutes");

                                }
                            });
                            // getBasicUserData1({ fbId: id }).then((respBasicData) => {
                            
                            // });
            

                        } else {
                            console.log("esle ===============================");
                            setBasicUserData1({ fbId: id, key: 'contextId', value: responseMessage.context }).then((respData) => {
                           
                                messageForwardOrProcess(id, JSON.parse(responseMessage.output.text[0]));
                            })
                        }
                    }
                    else {
                        console.log("Mulitiple Responses +================================");
                        console.log("responseMessage.output.text.length",responseMessage.output.text.length);
                        if(responseMessage.output.text[0].length>0)
                        {

                            setBasicUserData1({ fbId: id, key: 'contextId', value: responseMessage.context }).then((respData) => {
                                  
                                console.log("respData",respData);
                                messageForwardOrProcess(id, JSON.parse(responseMessage.output.text[0]));
                                messageForwardOrProcess(id, JSON.parse(responseMessage.output.text[1]));
                            })
                            
                            // for(var i=0;i<responseMessage.output.text.length;i++)
                            // {
                            //     console.log("insdide for");
                            // //    console.log("responseMessage",responseMessage);
                            //  //   console.log("responseMessage.output.text[i]",JSON.parse(responseMessage.output.text[i]));
                            //     setBasicUserData1({ fbId: id, key: 'contextId', value: responseMessage.context }).then((respData) => {
                                  
                            //         console.log("respData",respData);
                            //         messageForwardOrProcess(id, JSON.parse(responseMessage.output.text[i]));
                            //     })

                            // }
                        }
                        else
                        {
                            setBasicUserData1({ fbId: id, key: 'contextId', value: responseMessage.context }).then((respData) => {
                        
                                messageForwardOrProcess(id, JSON.parse(responseMessage.output.text[0]));
                            })

                        }
                   
                    }
                  
                }
                else {
                    setBasicUserData1({ fbId: id, key: 'contextId', value: responseMessage.context }).then((respData) => {
                        console.log("===========================================")
                        messageForwardOrProcess(id, responseMessage.output.text[0]);
                    })
                }
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
            console.log("buttonsAppendText",buttonsAppendText)
            var buttons = [];
            console.log("buttons",buttons)
            for (let i = 0; i < messageLocal.ButtonValues.length; i++) {
                buttons.push({
                    "type": "postback",
                    "title": messageLocal.ButtonValues[i],//SOME ONE ELSE
                    "payload": messageLocal.ButtonValues[i]//soneoneelse
                });
                buttonsAppendText = buttonsAppendText + " -> " + messageLocal.ButtonValues[i];
                console.log("buttonsAppendText",buttonsAppendText)
                if (i == messageLocal.ButtonValues.length - 1) {
                    getBasicUserData({ fbId: id }).then((getResponse) => {
                        getResponse.text = buttonsAppendText;
                        getResponse.id = id;
                        insightBotResponseFunction(getResponse);
                    })
                }
            }
        }
        else {
            //console.log('no buttons');
            loginSuccessMessage(id, messageLocal.message);
           
           // loginSuccessMessage1(id);
        }

    }
    else if (messageLocal.action == 'process') {
        //console.log('!---------message is processing----------!');

        getBasicUserData({ fbId: id }).then((respBasicData) => {
            // //console.log("respBasicData", respBasicData.resData.contextId);
            // //console.log("messageLocal in", messageLocal);
            // //console.log("messageLocal in", messageLocal.data);
            //console.log("messageLocal.data.function", messageLocal.data.function);

            if (messageLocal.data.function == 'addNewUser') {
                console.log("inside addNewUser");
                console.log("Email", respBasicData.resData.contextId.Email)
                updateUserDetails({ "fbId": id, "userEmail": respBasicData.resData.contextId.Email, "phoneNo": respBasicData.resData.contextId.Ph_number, "userName": respBasicData.resData.contextId.Name }).then(() => {
                    //  loginSuccessMessage(id, "Thank you for the info, you can ask me about VIVA plans & services. ");
                    buttonSend2(id, "Perfect! Now, how can I help you today?")
                })
            }
            else if (messageLocal.data.function == "connectToAgent") {

                updateContext({ "fbId": id }).then((data) => {
                    console.log("inside connect agent", data);
                    loginSuccessMessage(id, "Please give me a moment while we find you an agent")
                    getBasicUserData({ "fbId": id }).then((respBasicData) => {
                        socketImplementation(id, "Connect with an agent", respBasicData.resData.contextId.conversation_id, respBasicData.resData.contextId.Email, respBasicData.resData.contextId.Ph_number)
                    })
                    //     


                })
            }
            else if(messageLocal.data.function == "Financing Plan"  ){
                loginSend1(id, " Yes, for more information please find here")
 // sendCards1(id) 
                   

            }
            else if(messageLocal.data.function == "Mobile_Home_Models"){
                loginSuccessMessage(id,"These are the mobile home models")
            sendCards(id) 
             }

             else if(messageLocal.data.function == "Contact"){
                loginSuccessMessage(id,"Sure, please feel free to reach out to us")
                sendCards1(id) 
             }
             else if(messageLocal.data.function == "Career Opprtunities"){
                getDetails({ "fbId": id}).then((data) => {
                 console.log("inside career Opportunities@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@")
                 console.log(data.resData.docs[0].userEmail)
                //  loginSuccessMessage(id, " Thank you for the interest");
                
                buttonSend3(id,"Thank you for the interest, please confirm your contact details \n\n "+'*Full Name* : '+data.resData.docs[0].userName+'\n *Email* : '+data.resData.docs[0].userEmail+' \n *Phone* : '+data.resData.docs[0].phoneNo+"\n \n")
                })
             }

             else if(messageLocal.data.function == "opportunities_yes"){
           
                loginSuccessMessage(id, "These are the available opportunities we have");
                sendCard(id) 
             }
   
             else if(messageLocal.data.function == "opprtunities_No"){
                updateDetails({ "fbId": id, "userEmail": respBasicData.resData.contextId.Email, "phoneNo": respBasicData.resData.contextId.Ph_number }).then(() => {
                 
                  
                })
                loginSuccessMessage(id, "Your details has been updated succesfully. These are the available opportunities we have");
                sendCard(id) 
             }
   else if (messageLocal.data.function == "Communities"){
                communities({ "fbId": id, "code": respBasicData.resData.contextId.Code2}).then((data) => {
                    var cardData2= data.resData.docs;
                    sendCards4(id, cardData2) 
                     
                   })
             }
          
            else if (messageLocal.data.function == "Retailer"){
                 retailer({ "fbId": id, "code": respBasicData.resData.contextId.Code1}).then((data) => {
                    var cardData1 = data.resData.docs;
                    sendCards3(id, cardData1) 
                     
                    })
    
             }
            else if (messageLocal.data.function == "Homes"){
                console.log("inside homes###################################",  respBasicData.resData.contextId.Code)
                 homes({ "fbId": id, "code": respBasicData.resData.contextId.Code }).then((data) => {
                     console.log("((((((((((((((((((((((((((((((((((((((((", data)
                  var cardData = data.resData.docs;
                  console.log(")))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))", JSON.stringify(cardData))
                    sendCards2(id, cardData) 

                     
                    })
    
             }
             else if (messageLocal.data.function == "Shift_Home") {
                loginSend(id, "I can help you with that. Can you please login");
            }

        });

    }
    else {
        //console.log("messageLocal in else", messageLocal);
        loginSuccessMessage(id, messageLocal);

    }
    var creditDebitCardVal = {
        creditCard: "credit card",
        debitCard: "debit card",
        Savings: "savings",
        Checking: "checking"
    }

    function afterOtpProcessFun(messageLocal, phoneNo) {
        if (Object.keys(messageLocal).length == 0) {
            //console.log('this is first process');
        }

    }
}

http.listen(process.env.PORT || 7007, () => {
    console.log("App is running successfully");
});
