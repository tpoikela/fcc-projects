
var $NODE = 0;

/** Object for the GameOfLife. */
function GameOfLife(cols, rows) {
    this.cols = cols;
    this.rows = rows;
    this.cells = cols*rows;

    this.board = [];
    this.adjacent = {};

    var that = this;


    var xyToNum = function(x, y) {
        var result =  (x + y * that.cols);
        //console.log("For x " + x + " y " + y + " cols " + that.cols + " returning " + result);
        return result;
    };

    this.randomize = function() {
        for (var i = 0; i < this.board.length; i++) {
            var randNum = Math.floor(Math.random() * 100);
            this.board[i] = randNum % 2 === 0 ? true : false;
        }

    };

    this.clear = function() {
        for (var i = 0; i < this.board.length; i++) {
            this.board[i] = false;

        }
    };

    this.getRow = function(row) {
        var coord = xyToNum(0, row);
        return this.board.slice(coord, coord + this.cols);

    };

    this.setXY = function(x, y, val) {
        var coord = xyToNum(x, y);
        this.board[coord] = val;
    };

    this.getXY = function(x,y) {
        var coord = xyToNum(x, y);
        //console.log("Returning " + this.board[coord]);
        return this.board[coord];
    };

    this.getX = function(coord) {
        if (coord < this.cells) {
            return coord % this.cols;
        }
        else {
            console.error("coord " + coord + " out of bounds.");

        }
    };

    this.getY = function(coord) {
        if (coord < this.cells) {
            return Math.floor(coord / this.cols);
        }
        else {
            console.error("coord " + coord + " out of bounds.");

        }
    };

    this.getAdjacentAlive = function(coord) {
        var adjacent = this.adjacent[coord];
        var res = 0;
        for (var i = 0; i < adjacent.length; i++) {
            if (this.board[adjacent[i]] === true) {
                ++res;
            }
        }
        return res;

    };

    /** Generates all adjacent squares for given coordinated. This method has a
     * lot of border cases so it's rather lengthy. 
     * */
    this.getAdjacent = function(coord) {
        var adjacent = [];
        var x = this.getX(coord);
        var y = this.getY(coord);

        // Special cases:
        // Row 0 
        //      and col 0
        //      and col 'last'
        // Row 'last'
        //      and col 0
        //      and col 'last'
        //
        // Col 0
        // Col 'last'
        var nextRow = coord + this.cols;
        var prevRow = coord - this.cols;
        if (x !== 0) { // not first col
            adjacent.push(coord - 1);
            if(y !== 0) adjacent.push(prevRow - 1);
            if(y !== this.rows - 1) adjacent.push(nextRow - 1);
        }

        if (x !== this.cols - 1) {
            adjacent.push(coord + 1);
            if(y !== 0) adjacent.push(prevRow + 1);
            if(y !== this.rows - 1) adjacent.push(nextRow + 1);
        }

        if (y !== 0) adjacent.push(prevRow);
        if (y !== this.rows - 1) adjacent.push(nextRow);

        return adjacent;
    };

    for (var i = 0; i < this.cells; i++) {
        this.board.push(false);
        this.adjacent[i] = this.getAdjacent(i);
    }

    /** Given current cell value, and number of adjacent cells alive, returns
     * the next state for the cell. */
    this.nextCellState = function(currVal, numAlive) {
        if (numAlive < 2) return false;
        if (numAlive === 2) return currVal;
        if (numAlive === 3) return true;
        return false;
    };

    /** Advances the game to the next state.*/
    this.nextState = function() {
        var nextBoard = [];
        for (var i = 0; i < this.board.length; i++) {
            var numAlive = this.getAdjacentAlive(i);
            nextBoard.push(this.nextCellState(this.board[i], numAlive));
        }
        this.board = nextBoard;

    };

    this.print = function() {

    };
}

if ($NODE) {
    module.exports = GameOfLife;
}

