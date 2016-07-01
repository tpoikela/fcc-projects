

// Audio files used for the button sounds
var audio = {
    '1': "https://s3.amazonaws.com/freecodecamp/simonSound1.mp3",
    '2': "https://s3.amazonaws.com/freecodecamp/simonSound2.mp3",
    '3': "https://s3.amazonaws.com/freecodecamp/simonSound3.mp3",
    '4': "https://s3.amazonaws.com/freecodecamp/simonSound4.mp3",
};

// Holds a list of HTML audio elements
var audioElements = [];

var playErrorSound = function() {
    var playAllSounds = function() {
        for (var i = 0; i < audioElements.length; i++) {
            audioElements[i].play();
        }
    };
    setTimeout(playAllSounds, 100);
    setTimeout(playAllSounds, 200);
};

/** Turns specified button on.*/
var turnButtonOn = function(num) {

    $(".game-button").addClass("sqr-light");

    var btnID = "#btn" + num;
    $(btnID).removeClass("sqr-light");
    audioElements[num].play();

};

/** Turns specified button off. */
var turnButtonOff = function(num) {
    $(".game-button").addClass("sqr-light");
};

var gameMessage = function(msg) {
    if (messagingOn) {
        $("#winner-box").removeClass("text-danger");
        $("#winner-box").addClass("text-info");
        $("#winner-box").text(msg);
    }
};

var gameWarning = function(warning) {
    if (messagingOn) {
        $("#winner-box").removeClass("text-info");
        $("#winner-box").addClass("text-danger");
        $("#winner-box").text(warning);
    }
};


var waitUserInput = function() {
    waitingUser = true;
    gameMessage("Enter your sequence!");
};

var playNextRound = function() {
    waitingUser = false;
    gameMessage("Game in progress!");
    currUserPushes = 0;
    $("#count-box").val(expUserPushes);
    game.repeatSeq(expUserPushes, turnButtonOn, turnButtonOff, waitUserInput);
};

/** Moves to next round, and increases the blinking speed.*/
var advanceToNextRound = function() {
    ++expUserPushes;
    gameMessage("Starting next round soon...");
    gameSpeed -= 10;
    game.setSpeed(gameSpeed);
    setTimeout(playNextRound, 1000);
};

/** Called after winning/losing the game.*/
var afterGame = function() {
    waitingUser = false;
    gameInProgress = false;
    $("#start-button").text("Start");
    expUserPushes = 1;
    gameSpeed = initialGameSpeed;
    $("#on-off-light").removeClass("game-on");
};

var removeHighlight = function($button) {
    $($button).addClass("sqr-light");
};

var blinkButton = function(num, $button) {
    turnButtonOn(num);
    setTimeout(turnButtonOff, 150);
};

/** Called when the game is stopped. */
var stopCallback = function() {

};

/** Game ending conditions: 
 *  1. User stops the game
 *  2. Game won
 *  3. Game over (and lost) (in strict mode)
 */

var stopGame = function() {
    gameWarning("Game stopped by user!");
    console.log("Stopping the game.");
    game.stop(stopCallback);
    afterGame();
};

var gameWon = function() {
    setTimeout(function() {
        gameMessage("You won the game!!!");
    }, 2000);
    afterGame();
};

var gameOver = function() {
    playErrorSound();
    gameWarning("You lost this round!");
    $("#count-box").val("XX");
    afterGame();
};


/** Creates the audio elements for playing sounds. */
var createAudioElements = function () {
    for (var key in audio) {
        var audioElem = document.createElement("audio");
        audioElem.setAttribute("src", audio[key]);
        audioElem.setAttribute("id", "audio-" + key);
        audioElements.push(audioElem);
    }
};

var messagingOn = false;
var strictMode = true;
var waitingUser = false;

var initialGameSpeed = 750;
var gameSpeed = 750; // ms
var currUserPushes  = 0;
var expUserPushes   = 1;
var maxRounds = 20;
var game;
var gameInProgress = false;

$(document).ready( function () {

    createAudioElements();

    $("#start-button").click(function() {
        if (gameInProgress) {
            stopGame();
        }
        else {
            strictMode = $("#strict-box").is(":checked");
            gameInProgress = true;
            $("#on-off-light").addClass("game-on");
            game = new SimonGame(strictMode);
            $(".game-button").addClass("sqr-light");
            $("#start-button").text("Stop");
            playNextRound();
        }
    });

    $(".game-button").click(function() {
        if (waitingUser) {
            var btnID = $(this).attr("id");
            var num = parseInt(btnID.match(/\d$/));
            blinkButton(num, this);

            if (game.checkPush(currUserPushes, num)) {
                ++currUserPushes;

                if (expUserPushes === currUserPushes) {
                    gameMessage("You won this round!");
                    if (expUserPushes === maxRounds) {
                        gameInProgress = false;
                        setTimeout(gameWon, 1000);
                    }
                    else {
                        setTimeout(advanceToNextRound, 1000);
                    }
                }

            }
            else {
                console.error("Push " + currUserPushes + " was wrong. Got: " + num);
                if (strictMode) {
                    gameOver();
                }
                else {
                    gameMessage("Playing the sequence again...");
                    waitingUser = false;
                    playErrorSound();
                    $("#count-box").val("!!");
                    setTimeout(playNextRound, 1000);
                }
            }
        }
        else {
            console.error("You must wait for your turn!");
        }
    });

});
