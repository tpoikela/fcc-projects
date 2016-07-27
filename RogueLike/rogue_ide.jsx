
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

    nextActor : null,
    visibleCells: [],
    game: null,
    isTargeting: false,

    // Simple configuration for the game
    gameConf: {
        cols: 20,
        rows: 20,
        levels : 10,
        monsters: 2
    },

    getInitialState: function() {
        this.initGUICommandTable();
        this.game = RG.FACT.createGame(this.gameConf);
        var player = this.game.getPlayer();
        this.nextActor = player;
        this.visibleCells = player.getLevel().exploreCells(player);
        return {
            render: true
        };
    },

    /** When a cell is clicked, shows some debug info. */
    onCellClick: function(evt, x, y, cell) {
        debug("<Top> onCellClick with x: " + x + " y: " + y + " cell: " + cell);
    },

    newGame: function(evt) {
        this.game = RG.FACT.createGame(this.gameConf);
        var player = this.game.getPlayer();
        this.nextActor = player;
        this.visibleCells = player.getLevel().exploreCells(player);
        this.setState({render: true});
    },


    componentDidMount: function() {
      $(document.body).on('keydown', this.handleKeyDown);
    },

    componentWillUnMount: function() {
      $(document.body).off('keydown', this.handleKeyDown);
    },

    /** Listens for player key presses and handles them.*/
    handleKeyDown: function(evt) {
        var game = this.game;

        if (!game.isGameOver()) {
            game.clearMessages();

            if (this.nextActor !== null) {
                var code = evt.keyCode;
                if (this.isGUICommand(code)) {
                    this.doGUICommand(code);
                }
                else {
                    this.playerCommand(code);
                    this.nextActor = game.nextActor();

                    // Next/act until player found, then go back waiting for key...
                    while (!this.nextActor.isPlayer() && !game.isGameOver()) {
                        var action = this.nextActor.nextAction();
                        game.doAction(action);
                        this.nextActor = game.nextActor();
                        if (RG.isNullOrUndef([this.nextActor])) break;
                    }
                }
                this.setState({render: true});
            }

        }
        else {
            game.clearMessages();
            RG.POOL.emitEvent(RG.EVT_MSG, {msg: "GAME OVER!"});
            this.setState({render: true});
        }
    },


    playerCommand: function(code) {
        var game = this.game;
        var action = this.nextActor.nextAction({code: code});
        game.doAction(action);
        this.visibleCells = game.shownLevel().exploreCells(this.nextActor);
        //this.setState({render: true});
    },

    render: function() {
        var map = this.game.getVisibleMap();
        var player = this.game.getPlayer();
        var message = this.game.getMessages();
        //var numTurns = this.state.numTurns;
        return (
            <div id="main-div" className="container main-div">

                <GameInventory player={player}/>

                <div className="row">
                    <div className="col-md-2">
                        <GamePanel newGame={this.newGame}/>
                    </div>
                    <div className="col-md-10">
                        <GameMessages message={message}/>
                    </div>
                </div>
                <div className="row">
                    <div className="text-left col-md-2">
                        <GameStats player={player} />
                    </div>
                    <div className="col-md-10">
                        <GameBoard player={player} map={map} visibleCells={this.visibleCells} onCellClick={this.onCellClick}/>
                    </div>
                </div>

            </div>
        );
    },

    //-------------------------------------------------------------
    // GUI-RELATED COMMANDS
    //-------------------------------------------------------------

    /** GUI command keybindings are specified here. */
    initGUICommandTable: function() {
        this.guiCommands = {};
        this.guiCommands[ROT.VK_I] = this.GUIInventory;
        this.guiCommands[ROT.VK_T] = this.GUITarget;
    },

    isGUICommand: function(code) {
        if (this.isTargeting) {

        }
        else {
            return this.guiCommands.hasOwnProperty(code);
        }
        return false;
    },

    /** Calls a GUI command corresponding to the code.*/
    doGUICommand: function(code) {
        if (this.guiCommands.hasOwnProperty(code)) {
            this.guiCommands[code]();
        }
        else {
            console.error("Unknown keycode for GUI command.");
        }
    },

    /** Brings up the inventory.*/
    GUIInventory: function() {
        $("#inventory-button").trigger("click");
    },

    GUITarget: function() {
        if (this.isTargeting) {
            this.isTargeting = false;
            // TODO perform attack

        }
        else {
            this.isTargeting = true;
        }
    },

});

var GamePanel = React.createClass({

    render: function() {
        var newGame = this.props.newGame;
        return (
            <div>
                <button onClick={newGame}>Start</button>
            </div>
        );
    }

});

/** Component for displaying in-game messages.*/
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

/** Component renders the player inventory.*/
var GameInventory = React.createClass({

    render: function() {
        var player = this.props.player;
        var inv = player.getInvEq().getInventory();
        var eq = player.getInvEq().getEquipment();
        return (
            <div className="modal fade" role="dialog" id="inventoryModal" tabIndex="-1" role="dialog" aria-labelledby="inventory-modal-label" aria-hidden="true">
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header">
                            <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                                <span aria-hidden="true">&times;</span>
                            </button>
                            <h4 className="modal-title" id="inventory-modal-label">Inventory</h4>
                        </div>
                        <div className="modal-body row">
                            <div id="items-box" className="col-md-6">
                                <GameItems inv={inv} />
                            </div>
                            <div id="equipment-box" className="col-md-6">
                                <GameEquipment eq={eq} />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" data-dismiss="modal">Close</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

});

/** Component which shows the inventory items.*/
var GameItems = React.createClass({

    render: function() {
        var inv = this.props.inv;
        var item = inv.first();
        var items = [];
        while (item !== null && typeof item !== "undefined") {
            var type = item.getItemType();
            var we = item.getWeight();
            items.push(<p>Type: {type} Weight: {we}</p>);
            item = inv.next();
        }
        return (
            <div>
                <p>Items</p>
                {items}
            </div>
        );
    }

});

/** Component which shows the equipment of the player.*/
var GameEquipment = React.createClass({

    render: function() {
        var eq = this.props.eq;
        var slots = eq.getSlotTypes();
        var equipped = [];
        for (var i = 0; i < slots.length; i++) {
            var items = eq.getItems(slots[i]);
            equipped.push(
                <p>{slots[i]} {items[0]}</p>
            );
        }

        return (
            <div>
                <p>Equipment</p>
                {equipped}
            </div>
        );
    }

});

/** Component for displaying character stats.*/
var GameStats = React.createClass({

    render: function() {
        var player = this.props.player;

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
                <button id="inventory-button" className="btn btn-info" data-toggle="modal" data-target="#inventoryModal">Inventory</button>
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
            //var render = cellIndex === -1 ? false : true;
            var render = true;

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


ReactDOM.render(
    <RoguelikeTop />,
    document.getElementById("mount-point")
);


function debug(msg) {
    if ($DEBUG) {
        console.log("DEBUG:" + msg);
    }
}

