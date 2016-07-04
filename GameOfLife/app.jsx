
// Set to 1 for some debug information
var $DEBUG = 0;

// Titles for the buttons
var titles = {
    Next: "You can advance game by one state by pressing 'Next'.",
    Clear: "Clears the game board completely.",
    Random: "Generate a new starting pattern for the board.",
    Pause: "Pauses the game. You can push 'Next' or 'Start' for a paused game.",
};

/** Top-level component which renders all other components. Keeps also track
 * of the current game state.
 */
var GameOfLifeTop = React.createClass({

    delay: 100, //ms, Delay between state updates
    intervalID: undefined,

    getInitialState: function() {
        var game = new GameOfLife(50, 30);
        game.randomize();
        return {
            game: game,
            numGens: 0,
        };
    },

    onCellClick: function(evt, x, y) {
        debug("<Top> onCellClick with x: " + x + " y: " + y);
        var game = this.state.game;
        game.setXY(x, y, !game.getXY(x, y));
        this.setState({game: game});
    },

    nextState: function() {
        var game = this.state.game;
        game.nextState();
        this.setState({game: game, numGens: this.state.numGens+1});
    },

    startGame: function() {
        if (this.intervalID === undefined) {
            this.intervalID = setInterval(
                this.updateNextGameState, this.delay
            );
        }
    },

    stopGame: function() {
        if (this.intervalID !== undefined) {
            clearInterval(this.intervalID);
        }
        this.intervalID = undefined;
    },

    clearGame: function() {
        this.stopGame();
        var game = this.state.game;
        game.clear();
        this.setState({game: game, numGens: 0});
    },

    genRandom: function() {
        this.stopGame();
        var game = this.state.game;
        game.randomize();
        this.setState({game: game, numGens: 0});
    },

    setSize: function(cols, rows) {
        this.stopGame();
        console.log("cols: " + cols + " rows: " + rows);
        var game = new GameOfLife(parseInt(cols), parseInt(rows));
        game.randomize();
        this.setState({game: game, numGens: 0});
    },

    setSpeed: function(delayMs) {
        this.delay = delayMs;
        this.stopGame();
        this.startGame();
    },

    updateNextGameState: function() {
        this.nextState();
    },

    render: function() {
        var game = this.state.game;
        var numGens = this.state.numGens;
        return (
            <div className="main-div">
                <h1>Game of Life</h1>
                <GameCtrlTop 
                    nextState={this.nextState} 
                    startGame={this.startGame}
                    stopGame={this.stopGame}
                    clearGame={this.clearGame}
                    genRandom={this.genRandom}
                    numGens={numGens}
                />
                <GameBoard game={game} onCellClick={this.onCellClick}/>
                <GameCtrlBottom setSize={this.setSize} setSpeed={this.setSpeed}/>
            </div>
        );
    }

});

/** Control panel for starting, stopping, clearing and randomizing. */
var GameCtrlTop = React.createClass({

    onClickNext: function(evt) {
        this.props.nextState();
    },

    onClickClear: function(evt) {
        this.props.clearGame();
    },

    onClickStart: function(evt) {
        this.props.startGame();
    },

    onClickStop: function(evt) {
        this.props.stopGame();
    },

    onClickRandom: function(evt) {
        this.props.genRandom();
    },


    render: function() {
        var numGens = this.props.numGens;
        return (
            <div className="ctrl-top">
                <button className="btn btn-default" onClick={this.onClickStart}>Start</button>
                <button title={titles.Pause} className="btn btn-default" onClick={this.onClickStop}>Pause</button>
                <button title={titles.Next} className="btn btn-default" onClick={this.onClickNext}>Next</button>
                <button title={titles.Clear} className="btn btn-default" onClick={this.onClickClear}>Clear</button>
                <button title={titles.Random} className="btn btn-default" onClick={this.onClickRandom}>Random</button>
                <span className="num-generations">Generations: {numGens}</span>
            </div>
        );
    }

});

/** Component which renders the game rows. */
var GameBoard = React.createClass({

    tableClasses: "",

    render: function() {
        var game = this.props.game;
        var onCellClick = this.props.onCellClick;

        var rows = [];
        for (var i = 0; i < game.rows; ++i) {
            var rowData = game.getRow(i);
            rows.push(<GameRow 
                y={i} onCellClick={onCellClick} rowData={rowData} key={i} />);
        }

        return (
            <div id="game-board">
                <table id="game-table" border className={this.tableClasses}>
                    <thead></thead>
                    <tbody>
                        {rows}
                    </tbody>
                </table>
            </div>
        );
    }

});

/** A row component which holds a number of cells.*/
var GameRow = React.createClass({

    // Render only changed rows
    shouldComponentUpdate: function(nextProps, nextState) {
        return this.props.rowData !== nextProps.rowData;
    },


    render: function() {
        var onCellClick = this.props.onCellClick;
        var y = this.props.y;
        var rowData = this.props.rowData.map( function(val, index) {
            if (val) {
                return (<GameCell
                    x={index} y={y} onCellClick={onCellClick} value={val}
                    className="cell-active" key={index}/>);
            }
            else {
                return (<GameCell 
                    className="" value={val} x={index} y={y} onCellClick={onCellClick} key={index}/>);
            }
        });
        return (
            <tr>
                {rowData}
            </tr>
        );
    }

});

/** This components represents one cell in game of life.*/
var GameCell = React.createClass({

    shouldComponentUpdate: function(nextProps, nextState) {
        return this.props.value !== nextProps.value;
    },

    onCellClick: function(evt) {
        var x = this.props.x;
        var y = this.props.y;
        debug("<GameCell> onCellClick x: " + x + " y: " + y);
        this.props.onCellClick(evt, x, y);
    },

    render: function() {
        var className = this.props.className;
        return (
            <td className={className} onClick={this.onCellClick}></td>
        );
    }

});

/** Bottom control panel which contains buttons for selecting size of the board
 * and the speed of the game.*/
var GameCtrlBottom = React.createClass({

    setSize: function(evt) {
        debug("<GameCtrlBottom> setSize called with " + evt.target);
        var text = evt.target.name;
        debug("<GameCtrlBottom> name is " + text);
        var colsRows = text.split("x");
        this.props.setSize(colsRows[0], colsRows[1]);
    },

    /** Calls setSpeed callback with arg value based on which button was
     * pushed.*/
    setSpeed: function(evt) {
        var text = evt.target.name;
        switch(text) {
            case "Fast": this.props.setSpeed(100); break;
            case "Medium": this.props.setSpeed(300); break;
            case "Slow": this.props.setSpeed(500); break;
        }
    },

    render: function() {
        return (
            <div className="ctrl-bottom">
                <ul className="button-list">
                    <li><span>Size:</span></li>
                    <li><button name="50x30" className="btn btn-default" onClick={this.setSize}>50x30</button></li>
                    <li><button name="70x50" className="btn btn-default" onClick={this.setSize}>70x50</button></li>
                    <li><button name="100x70" className="btn btn-default" onClick={this.setSize}>100x70</button></li>
                    <span>Speed:</span>
                    <li><button name="Slow" className="btn btn-default" onClick={this.setSpeed}>Slow</button></li>
                    <li><button name="Medium" className="btn btn-default" onClick={this.setSpeed}>Medium</button></li>
                    <li><button name="Fast" className="btn btn-default" onClick={this.setSpeed}>Fast</button></li>
                </ul>
            </div>
        );
    }

});


ReactDOM.render(
    <GameOfLifeTop />,
    document.getElementById("mount-point")
);


function debug(msg) {
    if ($DEBUG) {
        console.log("DEBUG:" + msg);
    }
}

