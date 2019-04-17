
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

// Creates an array that lists out all of the options (Rock, Paper, or Scissors).
var computerChoices = ["r", "p", "s"];
var playerChoice = null;
var computerGuess = computerChoices[Math.floor(Math.random() * computerChoices.length)];
var wins;
var losses;
var ties;
database.ref("/gameData").on("value", function(snapshot) {
	if (snapshot.child("wins").exists()) wins = snapshot.val().wins;
	else wins = 0;
	
	if (snapshot.child("losses").exists()) losses = snapshot.val().losses;
	else losses = 0;
	
	if (snapshot.child("ties").exists()) ties = snapshot.val().ties;
	else ties = 0;
	
	displayScores();
	
  // If any errors are experienced, log them to console.
}, function(errorObject) {
	console.log("The read failed: " + errorObject.code);
});

//////////////////////////////////////////////////


var chatHistory = [];
var chatRowLimit = 10;
for (;chatHistory.length < chatRowLimit; chatHistory.push({})) {};

var newUserComment = {
	commentator:	"",
	comment:		""
}

//////////////////////////////////////////////////

// Create variables that hold references to the places in the HTML where we want to display things.
var directionsText = document.getElementById("directions-text");
var userChoiceText = document.getElementById("userchoice-text");
var computerChoiceText = document.getElementById("computerchoice-text");
var winsText = document.getElementById("wins-text");
var lossesText = document.getElementById("losses-text");
var tiesText = document.getElementById("ties-text");

function displayScores() {
			// Hide the directions
		directionsText.textContent = "";

		// Display the user and computer guesses, and wins/losses/ties.
		userChoiceText.textContent = "You chose: " + playerChoice;
		computerChoiceText.textContent = "The computer chose: " + computerGuess;
		winsText.textContent = "wins: " + wins;
		lossesText.textContent = "losses: " + losses;
		tiesText.textContent = "ties: " + ties;
}

function determineWinner(playerChoice) {
	
	// This logic determines the outcome of the game (win/loss/tie), and increments the appropriate number
	if ((playerChoice === "r") || (playerChoice === "p") || (playerChoice === "s")) {
		if ((playerChoice === "r" && computerGuess === "s") || (playerChoice === "s" && computerGuess === "p") || (playerChoice === "p" && computerGuess === "r")) wins++;
		else if (playerChoice === computerGuess) ties++;
		else losses++;

displayScores();
		
		database.ref("/gameData").set({
			wins:wins,
			losses:losses,
			ties:ties
		});
	}
	
}

// I want to add functionality to suspend the "RPS" listener when the chat input fields are in focus

function showHistory(commentObj) {
	if (typeof commentObj["commentator"] !== "undefined") return `<div class="row"><div class="col-auto mr-auto" style="text-align:left;"><strong>${commentObj["commentator"]}</strong></div><div class="col">${commentObj["comment"]}</div></div>`;
	else return `<div class="row"><div class="col" style="min-height:1.5em"></div></div>`;
}

// --------------------------------------------------------------
// At the page load and subsequent value changes, get a snapshot of the local data.
// This function allows you to update your page in real-time when the values within the firebase node chatData changes
database.ref("/chatData").on("value", function(snapshot) {
	if (snapshot.child("newComment").exists()) {
		if (chatHistory[chatHistory.length-1] !== snapshot.val().newComment) {
			if (chatHistory.length > chatRowLimit) chatHistory = chatHistory.slice(1); //we only want a max of 16 comments after the push
			newUserComment = snapshot.val().newComment;
			chatHistory.push(newUserComment);
		}
	}
  
	$("#chat-history").html(chatHistory.map(showHistory));

  // If any errors are experienced, log them to console.
}, function(errorObject) {
	console.log("The read failed: " + errorObject.code);
});

// --------------------------------------------------------------
// Whenever a user clicks the submit button
$("#submit-comment").on("click", function(event) {
	event.preventDefault();

	// Get the input values
	var commenterName = $("#commenter-name").val().trim();
	var newUserComment = $("#new-comment").val().trim();
    
	if (newUserComment && commenterName) {
		database.ref("/chatData").set({
			newComment: {commentator:commenterName,comment:newUserComment},
		});
	}
	$("#new-comment").val("");
});

// Whenever a user clicks the clear chat button
$("#clear-comments").on("click", function(event) {
	event.preventDefault();
	chatHistory = [];
	$("#chat-history").html("");
});

$(".choice-btn").on("click", function(event) {
	event.preventDefault();
	var clickedValue = event.target;
	var paramLetter = "";
		
	if (clickedValue.attributes[0].value === "Rock") paramLetter = 'r';
	else if (clickedValue.attributes[0].value === "Paper") paramLetter = 'p';
	else if (clickedValue.attributes[0].value === "Scissors") paramLetter = 's';
	
	determineWinner(paramLetter);
});