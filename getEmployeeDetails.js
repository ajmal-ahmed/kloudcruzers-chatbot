'use strict';
var http = require('http');
//var url = "http://s3.amazonaws.com/vzcloudhack/booking.json";
 /**
  * This sample demonstrates an implementation of the Lex Code Hook Interface
  * in order to serve a sample bot which manages orders for flowers.
  * Bot, Intent, and Slot models which are compatible with this sample can be found in the Lex Console
  * as part of the 'OrderFlowers' template.
  *
  * For instructions on how to set up and test this bot, as well as additional samples,
  *  visit the Lex Getting Started documentation.
  */


 // --------------- Helpers to build responses which match the structure of the necessary dialog actions -----------------------

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

function delegate(sessionAttributes, slots) {
    return {
        sessionAttributes,
        dialogAction: {
            type: 'Delegate',
            slots,
        },
    };
}

// ---------------- Helper Functions --------------------------------------------------




function buildValidationResult(isValid, violatedSlot, messageContent) {
    if (messageContent === null) {
        return {
            isValid,
            violatedSlot,
        };
    }
    return {
        isValid,
        violatedSlot,
        message: { contentType: 'PlainText', content: messageContent },
    };
}

function validateTicket(detailType,response) { 
    const categorys = ['status', 'job title', 'personal mobile', 'mobile', 'account', 'band', 'voip', 'details', 'function', 'awards', 'sub function', 'home number', 'sid', 'hr', 'business partner', 'opportunity', 'complaints', 'rating', 'bonus', 'resume'];
    if (detailType && categorys.indexOf(detailType.toLowerCase()) === -1) {
        return buildValidationResult(false, 'detailType', `Your ${detailType} details not found.Please see that you have typed correctly.If you know the information exists please inform your HR immediately so that we can add the information to our database.`);
    }
    

    return buildValidationResult(true, null, null);
}

 // --------------- Functions that control the bot's behavior -----------------------

/**
 * Performs dialog management and fulfillment for ordering flowers.
 *
 * Beyond fulfillment, the implementation of this intent demonstrates the use of the elicitSlot dialog action
 * in slot validation and re-prompting.
 *
 */
function problemTyping(intentRequest, callback) {
    const detailType = intentRequest.currentIntent.slots.detailType;
    const source = intentRequest.invocationSource;
	console.log("Detail type before the get request is "+detailType);

var finalData ="";
var detailValue ="";
var url =process.env.url ; 
console.log(url);
http.get(url, function(response) {
  response.on("data", function (data) {
    finalData += data.toString();
  });

  response.on("end", function() {
    var response=JSON.parse(finalData);
    if(detailType==="status"){
        detailValue="is "+response.status1;
        console.log("getting displayed"+detailValue);
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
        detailValue="is "+response.hrBp+".Please contact your manager for further details";
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
   
  
    var msg= "Your " +detailType+" "+detailValue;
    
	console.log(msg);
	
	if (source === 'DialogCodeHook') {
        // Perform basic validation on the supplied input slots.  Use the elicitSlot dialog action to re-prompt for the first violation detected.
        const slots = intentRequest.currentIntent.slots;
        const validationResult = validateTicket(detailType,response);
        if (!validationResult.isValid) {
            slots[`${validationResult.violatedSlot}`] = null;
            callback(elicitSlot(intentRequest.sessionAttributes, intentRequest.currentIntent.name, slots, validationResult.violatedSlot, validationResult.message));
            return;
        }

        // Pass the price of the flowers back through session attributes to be used in various prompts defined on the bot model.
        const outputSessionAttributes = intentRequest.sessionAttributes || {};
        if (detailType) {
            outputSessionAttributes.detail_Type = detailType; // Elegant pricing model
        }
        callback(delegate(outputSessionAttributes, intentRequest.currentIntent.slots));
        return;
    }
    console.log("your "+detailType+" has been displayed" );
    // Order the flowers, and rely on the goodbye message of the bot to define the message to the end user.  In a real bot, this would likely involve a call to a backend service.
    callback(close(intentRequest.sessionAttributes, 'Fulfilled',
    { contentType: 'PlainText', content: msg }));
  });

});


	
	 
	
	

}

 // --------------- Intents -----------------------

/**
 * Called when the user specifies an intent for this skill.
 */
function dispatch(intentRequest, callback) {
    console.log(`dispatch userId=${intentRequest.userId}, intentName=${intentRequest.currentIntent.name}`);

    const intentName = intentRequest.currentIntent.name;

    // Dispatch to your skill's intent handlers
    if (intentName === 'MyDetails') {
        return problemTyping(intentRequest, callback);
    }
  
    throw new Error(`Intent with name ${intentName} not supported`);
}

// --------------- Main handler -----------------------

// Route the incoming request based on intent.
// The JSON body of the request is provided in the event slot.
exports.handler = (event, context, callback) => {
    try {
        // By default, treat the user request as coming from the America/New_York time zone.
        process.env.TZ = 'America/New_York';
        console.log(`event.bot.name=${event.bot.name}`);

        /**
         * Uncomment this if statement and populate with your Lex bot name and / or version as
         * a sanity check to prevent invoking this Lambda function from an undesired Lex bot or
         * bot version.
         */
        /*
        if (event.bot.name !== 'OrderFlowers') {
             callback('Invalid Bot Name');
        }
        */
        dispatch(event, (response) => callback(null, response));
    } catch (err) {
        callback(err);
    }
};
