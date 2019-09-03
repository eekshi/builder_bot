const request = require('request');

// var token="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1ZDY1MTc4NWY4MzhlYTA5NDQyYzZjYjYiLCJjcmVhdGVkQXQiOiIyMDE5LTA4LTI3VDExOjQ0OjA1Ljk1OVoiLCJpYXQiOjE1NjY5MDYyNDZ9.hzZJrw7TvGIXQWYQcZIHBxi4Ux55DNQ1NG-LqOI_di0";
// var reference="17d225c68d4cafbcf9312c1b0c92bfaa";

// var insightsModule = function (auth_token, bot_reference) {
//     token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1ZDY1MTc4NWY4MzhlYTA5NDQyYzZjYjYiLCJjcmVhdGVkQXQiOiIyMDE5LTA4LTI3VDExOjQ0OjA1Ljk1OVoiLCJpYXQiOjE1NjY5MDYyNDZ9.hzZJrw7TvGIXQWYQcZIHBxi4Ux55DNQ1NG-LqOI_di0";
//     reference = "17d225c68d4cafbcf9312c1b0c92bfaa";
// };



var token="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1ZDVhYjUxYTJjM2Y5ZjQxN2M1YWM3OGYiLCJjcmVhdGVkQXQiOiIyMDE5LTA4LTE5VDE0OjQxOjMwLjE3M1oiLCJpYXQiOjE1NjYyMjU2OTB9.RQTW1QcOggtoOChACsrM8S08yKV6JDeRLss6X4B7TlA";
var reference="995c3701729bb175dff4fde5d4fab5dc";

var insightsModule = function (auth_token, bot_reference) {
    token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1ZDVhYjUxYTJjM2Y5ZjQxN2M1YWM3OGYiLCJjcmVhdGVkQXQiOiIyMDE5LTA4LTE5VDE0OjQxOjMwLjE3M1oiLCJpYXQiOjE1NjYyMjU2OTB9.RQTW1QcOggtoOChACsrM8S08yKV6JDeRLss6X4B7TlA";
    reference = "995c3701729bb175dff4fde5d4fab5dc";
};

insightsModule.prototype.logMessage = function (messageObj) {
    //console.log('inside insightsModule')
   
    //console.log("");
    //console.log(token +"  "+reference)
    if (messageObj.message) {
         //console.log(messageObj);
        var messageData = {};
        messageData.origin = "User";
        messageData.type = messageObj.message.type;
        messageData.user = messageObj.message.user;
        messageData.conversationID = messageObj.message.conversationID;
        messageData.text = messageObj.message.text;
        messageData.timestamp = new Date();
        messageData.channel = messageObj.message.channel;
        //console.log("messageObj.message.intent",messageObj.message.intent);
        messageData.intent = messageObj.message.intent;
        messageData.id = messageObj.message.id
        //console.log("messageData.id in Request",messageData.id);
       //console.log("messageData.intent",messageData.intent);
        reportMessage(messageData);
    } else {
        if (messageObj.type == 'message') {
            var messageData = {};
            messageData.conversationID = messageObj.conversationID;
            messageData.timestamp = new Date();
            messageData.channel = messageObj.channel;
            messageData.text = messageObj.text;
            messageData.user = messageObj.user;
            messageData.origin = "Bot";
            messageData.id = messageObj.id
            //console.log("messageData.id",messageData.id);
            messageData.type = messageObj.type;
            reportMessage(messageData);
        }
    };

}

module.exports = insightsModule;

function reportMessage(messageData) {

    var requestPayload = {
        url:"https://minsights-watson-backend.azurewebsites.net/conversation/v4/register",
     //url: "https://minsights-server-v2-1.azurewebsites.net/conversation/v4/register",
      
     // url: "https://minsights-server-v2-1.azurewebsites.net/registerconversation/",
        method: 'POST',
        json: true,
        headers: {
            'refid': reference
        },
        auth: {
            'bearer': token
        },
        body: messageData
    };
    return new Promise(function (fulfill, reject) {
        request.post(requestPayload, function (err, response, body) {
            if (!err) {
                //console.log(body);
            } else {
                conosle.log("error fro insights");
                //console.log(err);
            }
        });
    })
}
