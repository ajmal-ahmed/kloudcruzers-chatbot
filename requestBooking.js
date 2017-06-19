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

function validateBooking(bookingType, time) { // ,time
    const bookTypes = ['cab', 'meeting room', 'webex'];
    if (bookingType && bookTypes.indexOf(bookingType.toLowerCase()) === -1) {
        return buildValidationResult(false, 'bookTypes', `We do not have ${bookingType}, would you like to book a something else?  Our most popular bookings are Meeting Room`);
    }
   
    if (time) {
        if (time.length !== 5) {
            // Not a valid time; use a prompt defined on the build-time model.
            return buildValidationResult(false, 'bookTime', null);
        }
        const hour = parseInt(time.substring(0, 2), 10);
        const minute = parseInt(time.substring(3), 10);
        if (isNaN(hour) || isNaN(minute)) {
            // Not a valid time; use a prompt defined on the build-time model.
            return buildValidationResult(false, 'bookTime', null);
        }
        if (hour < 19 || hour > 23) {
            // Outside of business hours
            return buildValidationResult(false, 'bookTime', `${bookingType} is not available ${time}. Please try booking for some other time`);
        }
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
function bookingService(intentRequest, callback) {
    const bookingType = intentRequest.currentIntent.slots.bookService;
   // const date = intentRequest.currentIntent.slots.PickupDate;
   const time=intentRequest.currentIntent.slots.bookTime;
    var times = intentRequest.currentIntent.slots.bookTime;
    const source = intentRequest.invocationSource;

	console.log("booking type before the get request is "+bookingType)
	

var i;

 var finalData = "";
   var bookedService=" ";
var url = process.env.url;
http.get(url, function(response) {
  response.on("data", function (data) {
    finalData += data.toString();
  });

  response.on("end", function() {
    var response=JSON.parse(finalData);
    var timeString=times;
	//for(i=0;i<6;i++){
    if(bookingType==="cab"){
		for(i=0;i<6;i++)
		{
			if(response.cabBooking.cabs[i].time === times)
				bookedService=response.cabBooking.cabs[i].bookingId;
			
		//	console.log("the times are: "+response.cabBooking.cabs[i].time);
			
		}
    }
    else if(bookingType==="meeting room"){
       for(i=0;i<6;i++)
		{
			if(response.conference.availableTime[i] === times)
				bookedService=response.conference.rooms[i];
		}
    }
    else if(bookingType==="webex"){
		for(i=0;i<3;i++)
		{
			//bookedService= response.webEx.MeetingRooms[1].time;
			if(response.webEx.MeetingRooms[i].time === times)
				bookedService="Details are:\n MeetingNumber: "+response.webEx.MeetingRooms[i].meetingNumber+"\n Toll Free Number: "+response.webEx.MeetingRooms[i].tollFreeNumber+"\n WEbEx Link: "+response.webEx.MeetingRooms[i].webexLink;
		}
    }
   
    
    //var msg= "Your " +bookingType+" is "+bookedService+" for"+timeString;
    
	//console.log(msg);
	
	if (source === 'DialogCodeHook') {
        // Perform basic validation on the supplied input slots.  Use the elicitSlot dialog action to re-prompt for the first violation detected.
        const slots = intentRequest.currentIntent.slots;
        const validationResult = validateBooking(bookingType, time); //time
        if (!validationResult.isValid) {
            slots[`${validationResult.violatedSlot}`] = null;
            callback(elicitSlot(intentRequest.sessionAttributes, intentRequest.currentIntent.name, slots, validationResult.violatedSlot, validationResult.message));
            return;
        }

        // Pass the price of the flowers back through session attributes to be used in various prompts defined on the bot model.
        const outputSessionAttributes = intentRequest.sessionAttributes || {};
        if (bookingType) {
            outputSessionAttributes.book_Type = bookingType; // Elegant pricing model
        }
        callback(delegate(outputSessionAttributes, intentRequest.currentIntent.slots));
        return;
    }
    console.log("your "+bookingType+" has been booked and the id is "+bookedService);
    // Order the flowers, and rely on the goodbye message of the bot to define the message to the end user.  In a real bot, this would likely involve a call to a backend service.
    callback(close(intentRequest.sessionAttributes, 'Fulfilled',
    { contentType: 'PlainText', content: `Thanks, your ${bookingType} for ${time} has been booked and id is ${bookedService}.You will receive an sms shortly.` }));
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
    if (intentName === 'bookAmenity') {
        return bookingService(intentRequest, callback);
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
        callback("This query can't be completed because the bot is undergoing training, please try again later");
    }
};
