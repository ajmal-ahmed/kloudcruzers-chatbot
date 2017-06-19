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

function validateEmplyeeId(response,empId,sid) {
    var msg="Welcome " +response.empName;
    console.log("validation:"+empId);
    console.log("validaSid"+sid)
    if(empId && empId!=response.empId){
       
            return buildValidationResult(false, 'empId', `The employee Id is not valid.Please enter a correct Empolyee Id`);
    
    }
   // else if(empId && empId==response.empId){
        console.log(parseInt(response.sid,10)%10000);
        if(sid && sid!=parseInt(response.sid,10)%10000){
            return buildValidationResult(false, 'sid', `The VZ id and sid do not match.Please enter the Sid again`);
        }
       // else if(sid && sid==parseInt(response.sid,10)%10000){
          //  return buildValidationResult(true, null, msg);
       // }
    
    
    
        
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
function signIn(intentRequest, callback) {
    
    
    const empId = intentRequest.currentIntent.slots.empId;
    const sid = intentRequest.currentIntent.slots.sid;
    const source = intentRequest.invocationSource;
 //   console.log('request received for userId=${intentRequest.userId}, intentName=${intentRequest.currentIntent.intentName}');
    console.log("signIn"+empId);
    console.log("signIn"+sid);
    
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
    console.log("signIn"+responseEmpId);
    var msg='';

    if (source === 'DialogCodeHook') {
        // Perform basic validation on the supplied input slots.  Use the elicitSlot dialog action to re-prompt for the first violation detected.
        const slots = intentRequest.currentIntent.slots;
        const validationResult1 = validateEmplyeeId(response,empId,sid);
        

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
        { contentType: 'PlainText', content: `Welcome ${response.empName}.\r\n There are a lot of things that you can do at EBuddy like finding your current salary structure,book cab,create webex,raise trouble tickets etc.For a whole list of tasks refer to the EBuddy Docs.Can I do something for you?` }));//validationResult.message }));
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
    if (intentName === 'EmployeeSignIn') {
        return signIn(intentRequest, callback);
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
