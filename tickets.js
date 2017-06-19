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

function validateTicket(problem, category,response) { // ,time
    const categorys = ['hardware', 'software', 'infrastructure'];
    if (problem && categorys.indexOf(problem.toLowerCase()) === -1) {
        return buildValidationResult(false, 'problemType', `We do not have ${problem}, would you like to check something else?`);
    }
    var hardware=response.hardware.problemType;
    var software=response.software.problemType;
    var infra=response.infrastructure.problemType;
    var flag=false;
    if(category){
        console.log(category+"yesss");
    for(var prob_type in hardware){
        if(category==prob_type){
            flag=true;
            break;
        }
    }
    for(var prob_type1 in software){
        if(category==prob_type1){
            flag=true;
            break;
        }
    }
    for(var prob_type2 in infra){
        if(category==prob_type2){
            flag=true;
            break;
        }
    }
    
    if(flag===false)
        return buildValidationResult(false,'category',`We do not have ${category}, would you like to try something else?`);
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
    var problemType = intentRequest.currentIntent.slots.problemType;
    const category= intentRequest.currentIntent.slots.category;
    const source = intentRequest.invocationSource;
	console.log("Problem type before the get request is "+problemType+" and category is :"+category)
	var ticketType= problemType;
	console.log("TESTLOGS*********"+problemType);

var i;
var finalData ="";
var bookedService="";
var contact ="";
var problemTypeGen= "";
//var url = process.env.url;
var url = "http://s3.amazonaws.com/vzcloudhack/tickets.json";    
http.get(url, function(response) {
  response.on("data", function (data) {
    finalData += data.toString();
  });

  response.on("end", function() {
    var response=JSON.parse(finalData);
    if(problemType==="hardware"){
         contact=response.hardware.problemType;
        console.log("you can contact "+contact[category]);
			
		
    }
    else if(problemType==="software"){
         contact=response.software.problemType;
        console.log("you can contact "+contact[category]);
			
		
    }
    else if(problemType==="infrastructure"){
         contact=response.infrastructure.problemType;
        console.log("you can contact "+contact[category]);
			
		
    }
   
  
    var msg= "Your " +problemType + contact[category];
    
	console.log(msg);
	
	if (source === 'DialogCodeHook') {
        // Perform basic validation on the supplied input slots.  Use the elicitSlot dialog action to re-prompt for the first violation detected.
        const slots = intentRequest.currentIntent.slots;
        const validationResult = validateTicket(problemType, category,response); //time
        if (!validationResult.isValid) {
            slots[`${validationResult.violatedSlot}`] = null;
            callback(elicitSlot(intentRequest.sessionAttributes, intentRequest.currentIntent.name, slots, validationResult.violatedSlot, validationResult.message));
            return;
        }

        // Pass the price of the flowers back through session attributes to be used in various prompts defined on the bot model.
        const outputSessionAttributes = intentRequest.sessionAttributes || {};
        if (problemType) {
            outputSessionAttributes.problem_type = problemType; 
        }
        callback(delegate(outputSessionAttributes, intentRequest.currentIntent.slots));
        return;
    }
    console.log("your "+problemType+" has been raised" );
    // Order the flowers, and rely on the goodbye message of the bot to define the message to the end user.  In a real bot, this would likely involve a call to a backend service.
    callback(close(intentRequest.sessionAttributes, 'Fulfilled',
    { contentType: 'PlainText', content: `Thanks, your complaint has been booked with ${contact[category]}.He will contact you soon. ` }));
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
    if (intentName === 'HardwareTickets') {
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
        callback("This query can't be suported because the bot is undergoing training, Please try later");
    }
};
