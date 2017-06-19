'use strict';

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
var incorrectPasswordFlag=false;
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

function changePassword(response,newPwd) {
    var msg="Your password has been changed " +response.empName;
    console.log("validation:"+newPwd);
    var passwRegex=  /^[A-Za-z]\w{7,14}$/;  
    // if(newPwd && newPwd.length<7)
    //     return buildValidationResult(false, 'password', `Please enter a valid password between 7 to 16 characters which contains only characters, numeric digits, underscore and first character must be a letter`);
    if(newPwd && !passwRegex.test(newPwd)){
       
            return buildValidationResult(false, 'password', `Please enter a valid password between 7 to 16 characters which contains only characters, numeric digits, underscore and first character must be a letter`);
    
    }
       
        return buildValidationResult(true, null, msg);
    
}




 // --------------- Functions that control the bot's behavior -----------------------

/**
 * Performs dialog management and fulfillment for ordering flowers.
 *
 * Beyond fulfillment, the implementation of this intent demonstrates the use of the elicitSlot dialog action
 * in slot validation and re-prompting.
 *
 */
function pass(intentRequest, callback) {
    
    
    const newPwd = intentRequest.currentIntent.slots.password;
    const source = intentRequest.invocationSource;
 //   console.log('request received for userId=${intentRequest.userId}, intentName=${intentRequest.currentIntent.intentName}');
    console.log("pass"+newPwd);
    
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
    var responseEmpId=response.empId;
    var msg='';

    if (source === 'DialogCodeHook') {
        // Perform basic validation on the supplied input slots.  Use the elicitSlot dialog action to re-prompt for the first violation detected.
        const slots = intentRequest.currentIntent.slots;
        const validationResult1 = changePassword(response,newPwd);
        

        if (!validationResult1.isValid) {
            slots[`${validationResult1.violatedSlot}`] = null;
            callback(elicitSlot(intentRequest.sessionAttributes, intentRequest.currentIntent.name, slots, validationResult1.violatedSlot, validationResult1.message));
            return;
        }
        

        // Pass the price of the flowers back through session attributes to be used in various prompts defined on the bot model.
        const outputSessionAttributes = intentRequest.sessionAttributes || {};

         if (responseEmpId) {
            outputSessionAttributes.employee_id = responseEmpId; // Elegant pricing model
            outputSessionAttributes.employee_name=response.empName;
            
        }
        callback(delegate(outputSessionAttributes, intentRequest.currentIntent.slots));
        return;
    }
       // if (validationResult.isValid===true) {
            //outputSessionAttributes.employeeName = ; // Elegant pricing model
            callback(close(intentRequest.sessionAttributes, 'Fulfilled',
        { contentType: 'PlainText', content: `${response.empName} Your password has been changed to ${newPwd}.\r\n\r\n There are a lot of things that you can do at EBuddy like finding your current salary structure,book cab,create webex,raise trouble tickets etc.For a whole list of tasks refer to the EBuddy Docs.\r\n\r\nCan I do something else for you?` }));//validationResult.message }));
        //}
    
        
  });
  
});

}
    // Order the flowers, and rely on the goodbye message of the bot to define the message to the end user.  In a real bot, this would likely involve a call to a backend service.
    


 // --------------- Intents -----------------------

/**
 * Called when the user specifies an intent for this skill.
 */
function dispatch(intentRequest, callback) {
    console.log(`dispatch userId=${intentRequest.userId}, intentName=${intentRequest.currentIntent.name}`);

    const intentName = intentRequest.currentIntent.name;

    // Dispatch to your skill's intent handlers
    if (intentName === 'PasswordReset') {
        return pass(intentRequest, callback);
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
        callback("This query can't be completed because the bot is undergoing training , please try again later.");
    }
};
