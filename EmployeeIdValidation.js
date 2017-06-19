'use strict';

// Close dialog with the customer, reporting fulfillmentState of Failed or Fulfilled 
function close(sessionAttributes, fulfillmentState, message) {
    return {
        sessionAttributes,
        dialogAction: {
            type: 'Close',
            fulfillmentState,
            message,
        },
    };
}

function elicitSlot(sessionAttributes, intentName, slots, slotToElicit, message) {
    return {
        sessionAttributes,
        dialogAction: {
            type: 'ElicitSlot',
            intentName,
            slots,
            slotToElicit,
            message,
        },
    };
}

function delegate(sessionAttributes, slots) {
    return {
        sessionAttributes,
        dialogAction: {
            type: 'Delegate',
            slots,
        },
    };
}
// --------------- Events -----------------------
 
function dispatch(intentRequest, callback) {
    
console.log('request received for userId=${intentRequest.userId}, intentName=${intentRequest.currentIntent.intentName}');
    const sessionAttributes = intentRequest.sessionAttributes;
    const slots = intentRequest.currentIntent.slots;
    const empId = slots.empId;
    console.log(empId);
    
var http = require('http');
var url = "http://ec2-54-174-80-222.compute-1.amazonaws.com/hrInformation.json";

http.get(url, function(response) {
  var finalData = "";

  response.on("data", function (data) {
    finalData += data.toString();
  });

  response.on("end", function() {
    console.log(finalData.length);
    var response=JSON.parse(finalData);
    var responseEmpId=response.empId;
    console.log(responseEmpId);
    var msg='';
    if(empId===responseEmpId){
        msg="Welcome "+response.empName;
    }
    else {
        msg="Invalid Employee Id.Please enter your Id again."
    }
    
     callback(close(sessionAttributes, 'Fulfilled',
    {'contentType': 'PlainText', 'content': msg}));
  });

});


    
   
    
}
 
// --------------- Main handler -----------------------
 
// Route the incoming request based on intent.
// The JSON body of the request is provided in the event slot.
exports.handler = (event, context, callback) => {
    try {
        var sessionAttributes = intentRequest.sessionAttributes;
        var slots = intentRequest.currentIntent.slots;
        callback(elicitSlot(intentRequest.sessionAttributes, intentRequest.currentIntent.name, slots, validationResult.violatedSlot, validationResult.message));
        dispatch(event,
            (response) => {
                callback(null, response);
            });
    } catch (err) {
        callback(err);
    }
};

