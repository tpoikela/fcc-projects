
// Set to 1 for some debug information
var $DEBUG = 1;

// Titles for the buttons
var titles = {
    Next: "You can advance game by one state by pressing 'Next'.",
    Clear: "Clears the game board completely.",
    Random: "Generate a new starting pattern for the board.",
    Pause: "Pauses the game. You can push 'Next' or 'Start' for a paused game.",
};

var Actor = RG.RogueActor;

/** Top-level component which renders all other components. Keeps also track
 * of the current game state.
 */
var RoguelikeTop = React.createClass({

    delay: 100, //ms, Delay between state updates
    intervalID: undefined,

    nextActor = null,

    getInitialState: function() {
        var game = new RG.RogueGame();
        var mapGen = new RG.RogueMapGen();
        var level = new RG.RogueLevel();

        var cols = 50;
        var rows = 30;
        mapGen.setGen("arena", cols, rows);
        var map = mapGen.getMap();
        level.setMap(map);

        var actor = new Actor(true); // player
        level.addActor(actor, 2, 2);
        game.addPlayer(actor);
        game.addLevel(level);
        this.nextActor = actor;

        //var freeCells = map.getFree();
        //var player = new Player();
        //map.setProp(freeCells[0][0], freeCells[0][1], "player", player);
        return {
            game: game
        };
    },

    /** When a cell is clicked, shows some debug info. */
    onCellClick: function(evt, x, y, cell) {
        debug("<Top> onCellClick with x: " + x + " y: " + y + " cell: " + cell);
        //var game = this.state.game;
        //game.setXY(x, y, !game.getXY(x, y));
        //this.setState({game: game});
    },

    nextState: function() {
        /*
        var game = this.state.game;
        game.nextState();
        this.setState({game: game, numTurns: this.state.numTurns+1});
        */
    },

    startGame: function() {
    },

    stopGame: function() {
        /*
        if (this.intervalID !== undefined) {
            clearInterval(this.intervalID);
        }
        this.intervalID = undefined;
        */
    },

    clearGame: function() {
        /*
        this.stopGame();
        var game = this.state.game;
        game.clear();
        this.setState({game: game, numTurns: 0});
        */
    },

    genRandom: function() {
        /*
        this.stopGame();
        var game = this.state.game;
        game.randomize();
        this.setState({game: game, numTurns: 0});
        */
    },

    componentDidMount: function() {
      $(document.body).on('keydown', this.handleKeyDown);
    },

    componentWillUnMount: function() {
      $(document.body).off('keydown', this.handleKeyDown);
    },

    handleKeyDown: function(evt) {
        var code = evt.keycode;
        this.playerCommand(code);
        while (!nextActor.isPlayer() && !game.isGameOver()) {
            var action = nextActor.nextAction();
            action.doAction();
            this.setState({game: game});
            nextActor = game.nextActor();
        }
    },

    playerCommand: function(code) {
        var x = nextActor.getX();
        var y = nextActor.getY();
        if (code >= ROT.VK_LEFT && code <= ROT.VK_DOWN) {
            if (code === ROT.VK_RIGHT) ++x;
            // Need existing position
            // Check if new position possible
            // Move player to new position
            nextActor.setXY(x, y);
            // Schedule new event
            this.setState({game: game});
        }
    },

    setSize: function(cols, rows) {
        var map = this.genNewMap(cols, rows);
        this.setState({map: map});
    },

    setSpeed: function(delayMs) {
        /*
        this.delay = delayMs;
        this.stopGame();
        this.startGame();
        */
    },

    updateNextGameState: function() {
        //this.nextState();
    },

    render: function() {
        var map = this.state.game.getVisibleMap();
        var player = this.state.game.getPlayer();
        //var numTurns = this.state.numTurns;
        return (
            <div className="main-div">
                <h1>Roguelike IDE</h1><span>for FreeCodeCamp</span>
                <GameCtrlTop 
                    nextState={this.nextState} 
                    startGame={this.startGame}
                    stopGame={this.stopGame}
                    clearGame={this.clearGame}
                    genRandom={this.genRandom}
                />
                <GameBoard player={player} map={map} onCellClick={this.onCellClick}/>
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
        var numTurns = this.props.numTurns;
        return (
            <div className="ctrl-top">
                <button className="btn btn-default" onClick={this.onClickStart}>Start</button>
                <button title={titles.Pause} className="btn btn-default" onClick={this.onClickStop}>Pause</button>
                <button title={titles.Next} className="btn btn-default" onClick={this.onClickNext}>Next</button>
                <button title={titles.Clear} className="btn btn-default" onClick={this.onClickClear}>Clear</button>
                <button title={titles.Random} className="btn btn-default" onClick={this.onClickRandom}>Random</button>
                <span className="num-generations">Turns: {numTurns}</span>
            </div>
        );
    }

});

/** Component which renders the game rows. */
var GameBoard = React.createClass({

    tableClasses: "",

    render: function() {
        var map = this.props.map;
        var onCellClick = this.props.onCellClick;

        var rows = [];
        for (var i = 0; i < map.rows; ++i) {
            var rowCellData = map.getCellRow(i);
            rows.push(<GameRow 
                y={i} onCellClick={onCellClick} rowCellData={rowCellData} key={i} />);
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
        //return this.props.rowData !== nextProps.rowData;
        return true;
    },


    render: function() {
        var onCellClick = this.props.onCellClick;
        var y = this.props.y;
        var rowCells = this.props.rowCellData.map( function(cell, index) {
            if (cell.getVal()) {
                return (<GameCell cell={cell}
                    x={index} y={y} onCellClick={onCellClick} value={true}
                    className="cell-active" key={index}/>);
            }
            else {
                var cellClass = RG.getStyleClassForCell(cell);
                console.log("Rendering class " + cellClass + " for x: " + index + " y: " + y);
                return (<GameCell cell={cell}
                    className={cellClass} value={false} x={index} y={y} onCellClick={onCellClick} key={index}/>);
            }
        });
        return (
            <tr>
                {rowCells}
            </tr>
        );
    }

});

/** This components represents one cell in game of life.*/
var GameCell = React.createClass({

    shouldComponentUpdate: function(nextProps, nextState) {
        //return this.props.value !== nextProps.value;
        return true;
    },

    onCellClick: function(evt) {
        var x = this.props.x;
        var y = this.props.y;
        debug("<GameCell> onCellClick x: " + x + " y: " + y);
        this.props.onCellClick(evt, x, y, this.props.cell);
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
    <RoguelikeTop />,
    document.getElementById("mount-point")
);


function debug(msg) {
    if ($DEBUG) {
        console.log("DEBUG:" + msg);
    }
}

