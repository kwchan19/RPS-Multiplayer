function showHistory(commentObj) {
	return `<div class="row"><div class="col" style="text-align:right;"><strong>${commentObj["commentator"]}</strong></div><div class="col">${commentObj["comment"]}</div></div>`;
}

/* global moment firebase */

// Initialize Firebase
// Make sure to match the configuration to the script version number in the HTML
// (Ex. 3.0 != 3.7.0)
var config = {
				apiKey: "AIzaSyDaPEPOAtaQmZCa3uTg_IyDceAVAIlPRgM",
				authDomain: "rps-multiplayer-42479.firebaseapp.com",
				databaseURL: "https://rps-multiplayer-42479.firebaseio.com",
				projectId: "rps-multiplayer-42479",
				storageBucket: "gs://rps-multiplayer-42479.appspot.com",
				messagingSenderId: "315730385280"
			};

firebase.initializeApp(config);

// Create a variable to reference the database.
var database = firebase.database();

// -----------------------------

// connectionsRef references a specific location in our database.
// All of our connections will be stored in this directory.
var connectionsRef = database.ref("/connections");

// '.info/connected' is a special location provided by Firebase that is updated
// every time the client's connection state changes.
// '.info/connected' is a boolean value, true if the client is connected and false if they are not.
var connectedRef = database.ref(".info/connected");

// When the client's connection state changes...
connectedRef.on("value", function(snap) {

  // If they are connected..
  if (snap.val()) {

    // Add user to the connections list.
    var con = connectionsRef.push(true);
    // Remove user from the connection list when they disconnect.
    con.onDisconnect().remove();
  }
});

// When first loaded or when the connections list changes...
connectionsRef.on("value", function(snap) {

  // Display the viewer count in the html.
  // The number of online users is the number of children in the connections list.
  $("#connected-viewers").text(snap.numChildren());
});

// ------------------------------------
// Initial Values


var chatHistory = [];
var newUserComment = {
	commentator:	"",
	comment:		""
}

// --------------------------------------------------------------
// At the page load and subsequent value changes, get a snapshot of the local data.
// This function allows you to update your page in real-time when the values within the firebase node chatData changes
database.ref("/chatData").on("value", function(snapshot) {

  // If Firebase has a highPrice and highBidder stored (first case)
  if (snapshot.child("chatHistory").exists()) {

    // Set the local variables for highBidder equal to the stored values in firebase.

	chatHistory = snapshot.val().chatHistory;

    // change the HTML to reflect the newly updated local values (most recent information from firebase)
	$("#chat-history").html(chatHistory.map(showHistory));
  }
  else {
    // Change the HTML to reflect the local value in firebase
	$("#chat-history").html(chatHistory.map(showHistory));
  }

  // If any errors are experienced, log them to console.
}, function(errorObject) {
  console.log("The read failed: " + errorObject.code);
});

// --------------------------------------------------------------
// Whenever a user clicks the click button
$("#submit-comment").on("click", function(event) {
  event.preventDefault();

  // Get the input values
  var commenterName = $("#commenter-name").val().trim();
  var newUserComment = $("#new-comment").val().trim();
    
  chatHistory.push({commentator:commenterName,comment:newUserComment},);

    // Save the new price in Firebase
    database.ref("/chatData").set({
	  newComment: {commentator:commenterName,comment:newUserComment},
	  chatHistory: chatHistory
    });
	
	$("#chat-history").html(chatHistory.map(showHistory));

});