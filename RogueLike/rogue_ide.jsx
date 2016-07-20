
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

    nextActor : null,
    visibleCells: [],

    getInitialState: function() {
        var game = new RG.RogueGame();
        var mapGen = new RG.RogueMapGen();
        var level = new RG.RogueLevel();

        var cols = 100;
        var rows = 50;
        mapGen.setGen("arena", cols, rows);
        var map = mapGen.getMap();
        level.setMap(map);

        var actor = new Actor(true, "Player"); // player
        actor.setType("player");
        game.addLevel(level);
        game.addPlayer(actor);

        var item = new RG.RogueItem("food");
        var weapon = new RG.RogueItem("food");
        level.addItem(item, 3, 3);
        level.addItem(weapon, 4, 4);


        this.nextActor = actor;
        this.visibleCells = level.exploreCells(actor);

        var monster = new Actor(false, "Bjorn"); // Monster
        monster.setType("monster");
        game.addActorToLevel(monster, level);

        return {
            game: game
        };
    },

    /** When a cell is clicked, shows some debug info. */
    onCellClick: function(evt, x, y, cell) {
        debug("<Top> onCellClick with x: " + x + " y: " + y + " cell: " + cell);
    },

    newGame: function() {
    },


    componentDidMount: function() {
      $(document.body).on('keydown', this.handleKeyDown);
    },

    componentWillUnMount: function() {
      $(document.body).off('keydown', this.handleKeyDown);
    },

    /** Listens for player key presses and handles them.*/
    handleKeyDown: function(evt) {
        var game = this.state.game;

        if (!game.isGameOver()) {
            game.clearMessages();

            if (this.nextActor !== null) {
                var code = evt.keyCode;
                this.playerCommand(code);
                this.nextActor = game.nextActor();

                // Next/act until player found, then go back waiting for key...
                while (!this.nextActor.isPlayer() && !game.isGameOver()) {
                    var action = this.nextActor.nextAction();
                    game.doAction(action);
                    this.setState({game: game});
                    this.nextActor = game.nextActor();
                    if (RG.isNullOrUndef(this.nextActor)) break;
                }
            }

        }
        else {
            game.clearMessages();
            RG.POOL.emitEvent(RG.EVT_MSG, {msg: "GAME OVER!"});
            this.setState({game: game});
        }
    },

    playerCommand: function(code) {
        var game = this.state.game;
        var action = this.nextActor.nextAction({code: code});
        game.doAction(action);
        this.visibleCells = game.shownLevel().exploreCells(this.nextActor);
        this.setState({game: game});
    },

    render: function() {
        var game = this.state.game;

        var map = game.getVisibleMap();
        var player = game.getPlayer();
        var message = game.getMessages();
        //var numTurns = this.state.numTurns;
        return (
            <div className="main-div">
                <div className="row">
                    <div className="col-md-2">
                        <GamePanel />
                    </div>
                    <div className="col-md-10">
                        <GameMessages message={message}/>
                    </div>
                </div>
                <div className="row">
                    <div className="text-left col-md-2">
                        <GameStats player={player} game={game}/>
                    </div>
                    <div className="col-md-10">
                        <GameBoard player={player} map={map} visibleCells={this.visibleCells} onCellClick={this.onCellClick}/>
                    </div>
                </div>
            </div>
        );
    }

});

var GamePanel = React.createClass({

    render: function() {
        return (
            <div>
                <button>Start</button>
            </div>
        );
    }

});

var GameMessages = React.createClass({

    render: function() {
        var message = this.props.message;
        return (
            <div className="game-messages">
                <p>{message}</p>
            </div>
        );
    }

});

var GameStats = React.createClass({

    render: function() {
        var player = this.props.player;
        var game = this.props.game;

        var stats = {
            HP: player.getHP() + "/" + player.getMaxHP(),
            Att: player.getAttack(),
            Def: player.getDefense(),
            XP: player.getExp(),
            Level: player.getExpLevel(),
        };

        var statsHTML = [];
        var index = 0;
        for (var key in stats) {
            var val = stats[key];
            statsHTML.push(<li key={index}>{key}: {val}</li>);
            ++index;
        }

        return (
            <div className="game-stats">
                <ul>{statsHTML}</ul>
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

/** Component which renders the game rows. {{{2 */
var GameBoard = React.createClass({

    tableClasses: "",

    render: function() {
        var map = this.props.map;
        var onCellClick = this.props.onCellClick;
        var visibleCells = this.props.visibleCells;

        var rows = [];
        for (var i = 0; i < map.rows; ++i) {
            var rowCellData = map.getCellRow(i);
            rows.push(<GameRow 
                y={i} onCellClick={onCellClick} visibleCells={visibleCells} rowCellData={rowCellData} key={i} />);
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

}); //}}} Gameboard

/** A row component which holds a number of cells. {{{2 */
var GameRow = React.createClass({

    // Render only changed rows
    shouldComponentUpdate: function(nextProps, nextState) {
        //return this.props.rowData !== nextProps.rowData;
        return true;
    },


    render: function() {
        var onCellClick = this.props.onCellClick;
        var y = this.props.y;
        var visibleCells = this.props.visibleCells;
        var rowCells = this.props.rowCellData.map( function(cell, index) {
            var cellClass = RG.getStyleClassForCell(cell);
            var cellChar  = RG.getCellChar(cell);
            var cellIndex = visibleCells.indexOf(cell);
            var render = cellIndex === -1 ? false : true;

            return (<GameCell cell={cell} cellChar={cellChar} className={cellClass} x={index} 
                    y={y} render={render} onCellClick={onCellClick} key={index}/>);
        });
        return (
            <tr>
                {rowCells}
            </tr>
        );
    }

}); // }}} GameRow

/** This components represents one cell in game of life. {{{2 */
var GameCell = React.createClass({

    shouldComponentUpdate: function(nextProps, nextState) {
        return nextProps.render;
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
            <td className={className} onClick={this.onCellClick}>{this.props.cellChar}</td>
        );
    }

}); // }}} GameCell

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

