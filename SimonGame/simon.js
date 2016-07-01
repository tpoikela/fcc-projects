

var $TEST = 0; // When set to 1, runs some unit tests


/** Models a number sequence with random numbers. */
var NumSequence = function(min, max, len) {
    var seqLen = len;
    var minNum = min;
    var maxNum = max;

    var numSeq = [];
    var iterator = 0;

    // Creates the random numbers for the sequence
    for (var i = 0; i < len; i++) {
        var rand = min + Math.floor(Math.random() * (max+1-min));
        numSeq.push(rand);
    }


    this.first = function() {
        return numSeq[0];
    };

    this.next = function() {
        if (iterator < seqLen) {
            return numSeq[iterator++];
        }
        else {
            return null;
        }
    };

    this.finished = function() {
        return iterator === seqLen;
    };

    this.reset = function() {
        iterator = 0;
    };

    this.checkNum = function(index, num) {
        if (index < numSeq.length) {
            return numSeq[index] === num;
        }
        else {
            console.error("Too large index specified.");
            return false;
        }
    };

};

var SimonGame = function(strict) {
    var that = this;
    var isStrict = strict;
    var seq = new NumSequence(0, 3, 20);
    var seqInProgress = false;

    var buttonOn = false; // When button is on, set to true.
    var onPeriod  = 1000; //ms

    var currPlayCount = 0; // Keeps track of correct guesses

    var repeatID;

    this.nextButton = function() {
        return seq.next();
    };

    /** Internal function for executing the sequence upto times.*/
    var execSequence = function(upto, onCB, offCB, endCB) {
        if (seq.finished() === false && currPlayCount < upto) {
            if (buttonOn === false) {
                buttonOn = true;
                currButton = seq.next();
                onCB(currButton);
            }
            else {
                ++currPlayCount;
                buttonOn = false;
                offCB(currButton);
            }
        }
        else {
            console.log("Interval was cleared");
            seqInProgress = false;
            offCB(currButton);
            clearInterval(repeatID);
            seq.reset();
            currPlayCount = 0;
            endCB();
        }
    };

    /** Stops the game. A callback can be given which is also called.*/
    this.stop = function(stopCB) {
        if (seqInProgress) {
            seqInProgress = false;
            clearInterval(repeatID);
            seq.reset();
            currPlayCount = 0;
            stopCB();
        }
    };

    /** Repeats the sequence with given speed, and uses a callback.*/
    this.repeatSeq = function(upto, onCB, offCB, endCB) {
        if (seqInProgress === false) {
            seqInProgress = true;
            repeatID = setInterval(execSequence, onPeriod, upto, onCB, offCB, endCB);
        }
    };

    this.checkPush = function(numIndex, num) {
        return seq.checkNum(numIndex, num);
    };

    this.setSpeed = function(speed) {
        onPeriod = speed;
    };

};

/** Executed only if testing is enabled.*/
if ($TEST === 1) {

    var ok =  function(expr, msg) {
        if (expr) {
            console.log("OK: " + msg);
        }
        else {
            console.error("ERROR: " + msg);
        }
    };

    var newSeq = new NumSequence(0, 3, 20);

    for (var i = 0; i < 20; i++) {
        var num = newSeq.next();
        ok (num >= 0 && num <= 3, "Number must be 0:3: Got " + num);
    }
    ok(newSeq.finished(), "newSeq finished after 20x next()");
    ok(newSeq.next() === null, "Called next() for finished sequence");
}



