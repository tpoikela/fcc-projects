
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

    /** Styles to change the cell size.*/
    cellSize: {
        small: {
            "font-size": "16px",
            "margin-bottom": "-7px",
        },

        medium: {
            "font-size": "20px",
            "margin-bottom": "-9px",
        },

        large: {
            "font-size": "24px",
            "margin-bottom": "-11px",
        },

    },

    nextActor : null,
    visibleCells: [],
    game: null,
    isTargeting: false,

    // Simple configuration for the game
    gameConf: {
        cols: 200,
        rows: 30,
        levels : 3,
        monsters: 10
    },

    forceRender: function() {
        this.setState({render: true, renderFullScreen: true});
    },

    /** Sets the size of the shown map.*/
    setViewSize: function(evt) {

    },

    getInitialState: function() {
        this.initGUICommandTable();
        this.game = RG.FACT.createFCCGame(this.gameConf);
        RG.game = this.game;
        var player = this.game.getPlayer();
        this.nextActor = player;
        this.visibleCells = player.getLevel().exploreCells(player);
        RG.POOL.listenEvent(RG.EVT_LEVEL_CHANGED, this);
        return {
            render: true,
            renderFullScreen: false,
        };
    },

    /** When a cell is clicked, shows some debug info. */
    onCellClick: function(evt, x, y, cell) {
        if (this.isTargeting) {
            debug("<Top> Ranged attack to x: " + x + ", y:" + y);
        }
        else {
            debug("<Top> onCellClick with x: " + x + " y: " + y + " cell: " + cell);
        }
    },

    /** Called when "Start" button is clicked to create a new game.*/
    newGame: function(evt) {
        this.game = RG.FACT.createFCCGame(this.gameConf);
        RG.game = this.game;
        var player = this.game.getPlayer();
        this.nextActor = player;
        this.visibleCells = player.getLevel().exploreCells(player);
        this.setState({render: true, renderFullScreen: true});
    },

    notify: function(evtName, obj) {
        var actor = obj.actor;
        if (actor.isPlayer()) {
            this.setState({render: true, renderFullScreen: true});
        }
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
                this.setState({render: true, renderFullScreen: false});
            }

        }
        else {
            game.clearMessages();
            RG.POOL.emitEvent(RG.EVT_MSG, {msg: "GAME OVER!"});
            this.setState({render: true, renderFullScreen: false});
        }
    },


    /** Performs time consuming player command.*/
    playerCommand: function(code) {
        var game = this.game;
        var action = this.nextActor.nextAction({code: code});
        game.doAction(action);
        this.visibleCells = game.shownLevel().exploreCells(this.nextActor);
    },

    render: function() {
        var map = this.game.getVisibleMap();
        var player = this.game.getPlayer();
        var message = this.game.getMessages();
        var fullScreen = this.state.renderFullScreen;
        //var numTurns = this.state.numTurns;
        return (
            <div id="main-div" className="container main-div">

                <GameInventory forceRender={this.forceRender} player={player}/>

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
                        <GameBoard player={player} map={map} 
                            visibleCells={this.visibleCells} 
                            onCellClick={this.onCellClick}
                            renderFullScreen={fullScreen}
                        />
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
                {message}
            </div>
        );
    }

});

/** Component renders the player inventory.*/
var GameInventory = React.createClass({

    selectedItem: null,
    equipSelected: null,

    getInitialState: function() {
        return {
            invMsg: "",
            msgStyle: ""
        };
    },

    dropItem: function(evt) {
        if (this.selectedItem !== null) {
            var invEq = this.props.player.getInvEq();
            if (invEq.dropItem(this.selectedItem)) {
                this.setState({invMsg:  "Item dropped!",
                    msgStyle: "text-success"});
            }

        }
        else {
            this.setState({invMsg:  "No item selected!",
                msgStyle: "text-danger"});
        }
    },

    /** When "Equip" is clicked, equips the selected item, if any.*/
    equipItem: function(evt) {
        // Get item somehow
        if (this.selectedItem !== null) {
            var invEq = this.props.player.getInvEq();
            if (invEq.equipItem(this.selectedItem)) {
                this.setState({invMsg:  "Equipping succeeded!",
                    msgStyle: "text-success"});
            }
        }
        else {
            this.setState({invMsg:  "No item selected!",
                msgStyle: "text-danger"});
        }
    },

    /** Called when "Remve" button is clicked to remove an equipped item.*/
    unequipItem: function(evt) {
        if (this.equipSelected !== null) {
            var invEq = this.props.player.getInvEq();
            var num = this.equipSelected.slotNumber;
            var name = this.equipSelected.slotName;
            if (invEq.unequipItem(name, num)) {
                this.setState({invMsg:  "Removing succeeded!",
                    msgStyle: "text-success"});
            }
            else {
                this.setState({invMsg:  "Failed to remove the item!",
                    msgStyle: "text-danger"});
            }
        }
        else {
            this.setState({invMsg:  "No equipment selected!",
                msgStyle: "text-danger"});
        }
    },

    useItem: function(evt) {
        if (this.selectedItem !== null) {
            if (this.selectedItem.hasOwnProperty("useItem")) {
                var invEq = this.props.player.getInvEq();
                var target = this.props.player;
                if (invEq.useItem(this.selectedItem, {target: target})) {
                    var itemName = this.selectedItem.getName();
                    this.setState({invMsg: "You used the " + itemName + ".",
                        msgStyle: "text-success"});
                    this.props.forceRender();
                }
                else {
                    this.setState({invMsg: "You failed to use the " + itemName + ".",
                        msgStyle: "text-danger"});
                }
            }
            else {
                this.setState({invMsg:  "Cannot use the chosen item!",
                    msgStyle: "text-danger"});
            }
        }
        else {
            this.setState({invMsg:  "You must choose item to use!",
                msgStyle: "text-danger"});
        }

    },

    setSelectedItem: function(item) {
        this.selectedItem = item;
        var msg = "Inventory Selected: " + item.toString();
        this.setState({invMsg: msg, msgStyle: "text-info"});
    },

    setEquipSelected: function(selection) {
        this.equipSelected = selection;
        var msg = "Equipment Selected: " + selection.item.toString();
        this.setState({invMsg: msg, msgStyle: "text-info"});
    },

    render: function() {
        var player = this.props.player;
        var inv = player.getInvEq().getInventory();
        var eq = player.getInvEq().getEquipment();
        return (
            <div className="modal fade" role="dialog" id="inventoryModal" tabIndex="-1" role="dialog" aria-labelledby="inventory-modal-label" aria-hidden="true">
                <div className="modal-dialog modal-lg">
                    <div className="modal-content">
                        <div className="modal-header">
                            <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                                <span aria-hidden="true">&times;</span>
                            </button>
                            <h4 className="modal-title" id="inventory-modal-label">Inventory</h4>
                        </div>
                        <div className="modal-body row">
                            <div id="items-box" className="col-md-6">
                                <GameItems setSelectedItem={this.setSelectedItem} inv={inv} />
                            </div>
                            <div id="equipment-box" className="col-md-6">
                                <GameEquipment setEquipSelected={this.setEquipSelected} eq={eq} />
                            </div>
                        </div>
                        <div className="modal-footer row">
                            <div className="col-md-6">
                                <p className={this.state.msgStyle}>{this.state.invMsg}</p>
                            </div>
                            <div className="col-md-6">
                                <button type="button" className="btn btn-secondary" onClick={this.dropItem}>Drop</button>
                                <button type="button" className="btn btn-secondary" onClick={this.equipItem}>Equip</button>
                                <button type="button" className="btn btn-secondary" onClick={this.unequipItem}>Remove</button>
                                <button type="button" className="btn btn-secondary" onClick={this.useItem}>Use</button>
                                <button type="button" className="btn btn-secondary" data-dismiss="modal">Close</button>
                            </div>
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
        var setSelectedItem = this.props.setSelectedItem;

        while (item !== null && typeof item !== "undefined") {
            var type = item.getType();
            var we = item.getWeight();
            items.push(<GameItemSlot setSelectedItem={setSelectedItem} item={item} />);
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

/** Component stores one item, renders its description and selects it if
 * clicked.*/
var GameItemSlot = React.createClass({

    setSelectedItem: function() {
        this.props.setSelectedItem(this.props.item);
    },

    render: function() {
        var item = this.props.item;
        var itemString = item.toString();
        return (
            <div className="inv-item-slot" onClick={this.setSelectedItem}>{itemString}</div>
        );
    }

});

/** Component which shows the equipment of the player.*/
var GameEquipment = React.createClass({

    render: function() {
        var eq = this.props.eq;
        var slots = eq.getSlotTypes();
        var equipped = [];
        var setEquip = this.props.setEquipSelected;

        // Creates the equipment slots based on whether they have items or not.
        for (var i = 0; i < slots.length; i++) {
            var items = eq.getEquipped(slots[i]);
            if (items.length > 0) {
                for (var j = 0; j < items.length; j++) {
                    var key = i + "," + j;
                    equipped.push(
                        <GameEquipSlot setEquipSelected={setEquip} key={key} slotName={slots[i]} slotNumber={j} item={items[j]} />
                    );
                }
            }
            else {
                equipped.push(
                    <GameEquipSlot setEquipSelected={setEquip} slotName={slots[i]} slotNumber={j} item={null} />
                );
            }
        }

        return (
            <div>
                <p>Equipment</p>
                {equipped}
            </div>
        );
    }

});

/** Component for one equipment slot.*/
var GameEquipSlot = React.createClass({

    setEquipSelected: function(evt) {
        if (this.props.item !== null) {
            var selection = {
                slotName: this.props.slotName,
                slotNumber: this.props.slotNumber, 
                item: this.props.item
            };
            this.props.setEquipSelected(selection);
        }
    },

    render: function() {
        var slotName = this.props.slotName;
        var item = this.props.item;
        var msg = "Empty";
        if (item !== null) msg = item.toString();
        return (
            <div onClick={this.setEquipSelected} className="inv-equip-slot">{slotName} {msg}</div>
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

    viewportX: 35, // * 2
    viewportY: 12, // * 2

    getCellsInViewPort: function(x, y, map) {
        var startX = x - this.viewportX;
        var endX = x + this.viewportX;
        var startY = y - this.viewportY;
        var endY = y + this.viewportY;
        var res = {};

        var maxX = map.cols - 1;
        var maxY = map.rows - 1;

        var leftStartX = this.viewportX - x;
        if (leftStartX > 0) {
            endX += leftStartX;
        }
        else {
            var leftEndX = x + this.viewportX - maxX;
            if (leftEndX > 0) startX -= leftEndX;
        }

        var leftStartY = this.viewportY - y;
        if (leftStartY > 0) {
            endY += leftStartY;
        }
        else {
            var leftEndY = y + this.viewportY - maxY;
            if (leftEndY > 0) startY -= leftEndY;
        }

        // Some sanity checks for level edges
        if (startX < 0) startX = 0;
        if (startY < 0) startY = 0;
        if (endX > map.cols-1) endX = map.cols - 1;
        if (endY > map.rows-1) endY = map.rows - 1;

        // Compute leftovers if player is close enough to the edges
        //var leftStartX = viewPortX - x;
        //var endStartX = viewPortX - x;

        for (var yy = startY; yy <= endY; yy++) {
            res[yy] = [];
            for (var xx = startX; xx <= endX; xx++) {
                res[yy].push(map.getCell(xx, yy));
            }
        }

        res.startX = startX;
        res.endX = endX;
        res.startY = startY;
        res.endY = endY;
        res.rows = map.rows;
        res.getCellRow = function(y) {return res[y];};
        //console.log(res);
        return res;
    },

    render: function() {
        var player = this.props.player;
        var playX = player.getX();
        var playY = player.getY();
        var map = this.props.map;

        var shownCells = this.getCellsInViewPort(playX, playY, map);

        var onCellClick = this.props.onCellClick;
        var visibleCells = this.props.visibleCells;
        var renderFullScreen = this.props.renderFullScreen;

        var rows = [];
        //for (var i = 0; i < map.rows; ++i) {

        for (var i = shownCells.startY; i <= shownCells.endY; ++i) {
            var rowCellData = shownCells.getCellRow(i);
            rows.push(<GameRow 
                y={i} onCellClick={onCellClick} renderFullScreen={renderFullScreen}
                visibleCells={visibleCells} rowCellData={rowCellData} key={i} 
                    />);
        }

        return (
            <div id="game-board">
                <div id="game-table" className={this.tableClasses}>
                    {rows}
                </div>
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
        var renderFullScreen = this.props.renderFullScreen;
        var onCellClick = this.props.onCellClick;
        var y = this.props.y;
        var visibleCells = this.props.visibleCells;
        var rowCells = this.props.rowCellData.map( function(cell, index) {
            var cellIndex = visibleCells.indexOf(cell);
            var visibleToPlayer = cellIndex < 0 ? false: true;
            var cellClass = RG.getClassName(cell, visibleToPlayer);
            var cellChar  = RG.getChar(cell, visibleToPlayer);
            var cellX = cell.getX();
            //var render = cellIndex === -1 ? false : true;
            var render = true;
            if (renderFullScreen) render = true;

            return (<GameCell cell={cell} cellChar={cellChar} className={cellClass} x={cellX}
                    y={y} render={render} onCellClick={onCellClick} key={index}/>);
        });
        return (
            <div className="cell-row-div">
                {rowCells}
            </div>
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
        /*return (
        <td className={className} onClick={this.onCellClick}>{this.props.cellChar}</td>
        );*/
        return (
            <span className={className} onClick={this.onCellClick}>{this.props.cellChar}</span>
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

