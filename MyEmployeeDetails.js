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

 
// --------------- Events -----------------------
 
function dispatch(intentRequest, callback) {
    
//console.log('request received for userId=${intentRequest.userId}, intentName=${intentRequest.currentIntent.intentName}');
    const sessionAttributes = intentRequest.sessionAttributes;
    const detailType = intentRequest.currentIntent.slots.detailType;
    //const detailType = slots.mydetail;
    console.log(detailType);
    var detailValue="nothing";
    
    
var http = require('http');
var url = process.env.url;

http.get(url, function(response) {
  var finalData = "";

  response.on("data", function (data) {
    finalData += data.toString();
  });

  response.on("end", function() {
    console.log(finalData.length);
    var response=JSON.parse(finalData);
    if(detailType==="status"){
        detailValue="is "+response.status1;
    }
    else if(detailType==="job title"){
        detailValue="is "+response.jobTitle;
    }
    else if(detailType==="personal mobile"||detailType==="mobile"){
        detailValue="is "+response.personalMobile;
    }
    else if(detailType==="account"){
        detailValue="number is "+response.bankAccount;
    }
    else if(detailType==="band"){
        detailValue="is "+response.careerBand;
    }
    //  else if(detailType==="details"){
    //     detailValue=response.totalTax;sGF
    // }
     else if(detailType==="voip"||detailType==="business"){
        detailValue="number is "+response.business;
    }
     else if(detailType==="function"){
        detailValue="is "+response.function;
    }
     else if(detailType==="awards"){
        detailValue="received is "+response.awards;
    }
     else if(detailType==="sub function"){
        detailValue="is "+response.subFunction;
    }
     else if(detailType==="home number"){
        detailValue="is "+response.home;
    }
     else if(detailType==="sid"){
        detailValue="is "+response.sid;
    }
     else if(detailType==="hr"||detailType==="business partner"){
        detailValue="is "+response.hrBp+"Please contact your manager for further details";
    }
     else if(detailType==="opportunity"){
        detailValue=" for the following posts:"+"\n"+"1)"+" Band:"+response.opportunity.band+";"+" Role:"+response.opportunity.role+"; Skills Needed:"+response.opportunity.skills;
    }
     else if(detailType==="complaints"){
        detailValue="details: "+response.complaints;
    }
     else if(detailType==="rating"){
        detailValue="is "+response.rating;
    }
     else if(detailType==="bonus"){
        detailValue="received so far is: "+response.bonus;
    }
    
    else if(detailType==="resume"){
        detailValue="is at url: "+response.resume+" You can upload your new resume by going to http://vzweb2.verizon.com";
    }
    // else if(detailType==="salary structure"){
    //     payValue="HRA:"+response.salaryStructure.HRA+" ;TA:"+response.salaryStructure.TA+" ;DA:"+response.salaryStructure.DA+" ;PF:"+response.salaryStructure.PF+" ;Total Tax: "+response.totalTax+" ;Gross pay: "+response.grossPay;
    // }
    var msg= "Your " +detailType+" "+detailValue;
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
        dispatch(event,
            (response) => {
                callback(null, response);
            });
    } catch (err) {
        callback(err);
    }
};

