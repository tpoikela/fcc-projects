/*
 * Contains the main object "RoguelikeGame", the top-level game object.
 */

var $NODE = 0;

var RG = {

    IdCount: 0,

    cellPropRenderOrder: ['elements', 'actors', 'items', 'traps'],

    getStyleClassForCell: function(cell) {
        for (var i = 0; i < this.cellPropRenderOrder.length; i++) {
            var type = this.cellPropRenderOrder[i];
            if (cell.hasProp(type)) {
                return this.cellStyles[type];
            }
        }
        return "";
    },

    cellStyles: {
        elements: "cell-elements",
        actors: "cell-actors",
        items: "cell-items",
        traps: "cell-traps",
    },


    debug: function(msg) {
        console.log("[DEBUG]: " + msg);
    },

    err: function(obj, fun, msg) {
        console.error(obj + ": " + fun + " -> " + msg);
    },

};

RG.Locatable = function() {
    var _x;
    var _y;

    this.setX = function(x) {
        _x = x;
    };

    this.setY = function(y) {
        _y = y;
    };

    this.setXY = function(x,y) {
        _x = x;
        _y = y;
    };

    this.getX = function() {
        return _x;
    };

    this.getY = function() {
        return _y;
    };

    this.getXY = function() {
        return [_x, _y];
    };

    this.isSamePos = function(obj) {
        if (_x !== obj.getX()) return false;
        if (_y !== obj.getY()) return false;
        return true;
    };

};

/** Top-level object for the game. */
RG.RogueGame = function() {

    var _players = [];
    var _levels = [];
    var _activeLevels = [];
    var _time = "";

    var _scheduler = new ROT.Scheduler.Action();
    var _mapGen = new RG.RogueMapGen();

    var _initDone = false;
    this.initGame = function() {
        if (!_initDone) {

        }
    };

    /** Returns next actor from the scheduling queue.*/
    this.nextActor = function() {
        return _scheduler.next();
    };

    this.isGameOver = function() {
        return _gameOver;
    };

    this.getPlayer = function() {
        if (_players.length > 0) {
            return _players[0];
        }
        else {
            RG.err("Game", "getPlayer", "There are no players in the game.");
        }
    };

    this.addPlayer = function(player) {
        _players.push(player);
        _scheduler.add(player, true, 0);
    };

    this.doAction = function(action) {
        _scheduler.setDuration(action.getDuration());
    };

    this.addLevel = function(level) {
        _levels.push(level);
        _activeLevels.push(level);
    };

    this.getActiveLevels = function() {
        return _activeLevels;

    };

    /* Returns the visible map to be rendered by GUI. */
    this.getVisibleMap = function() {
        var player = this.getPlayer();
        var map = player.getLevel().getMap();
        return map;
    };

};

RG.RogueLevel = function(cols, rows) {
    var _actors = [];
    var _map = null;
    var _items = [];

    this.setMap = function(map) {
        _map = map;
    };
    this.getMap = function() {
        return _map;
    };

    this.addActor = function(actor, x, y) {
        if (actor instanceof RG.RogueActor) {
            _actors.push(actor);
            actor.setLevel(this);
            if (x !== null && y !== null) {
                _map.setProp(x, y, "actors", actor);
                actor.x = x;
                actor.y = y;
                RG.debug("Added actor to map x: " + x + " y: " + y);
            }
            else {

            }
        }
    };

};

RG.RogueActor = function(ctrl) {
    var _actions = [];
    var _brain = null;
    var _isPlayer = ctrl;
    var _level = null;
    this.id = RG.IdCount++;

    this.isPlayer = function() {
        return _isPlayer;
    };

    this.nextAction = function() {
        if (_isPlayer) {
            // Wait for key event

        }
        else {
            // Use AI brain to determine the action

        }
    };

    this.getLevel = function() {
        return _level;
    };

    this.setLevel = function(level) {
        _level = level;
    };

};

RG.RogueActor.prototype = Object.create(RG.Locatable.prototype);

/** Models an action. Each action has a duration and a callback.*/
RG.RogueAction = function(dur, cb) {

    var _duration = dur;

    var _cb = cb; // Action callback

    this.setCb = function(cb) {
        _cb = cb;
    };

    this.getDuration = function() {
        return _duration;
    };

    this.doAction = function() {
        _cb();
    };

};

/** Brain is used by the AI to perform and decide on actions.*/
RG.RogueBrain = function() {

};


//---------------------------------------------------------------------------
// MAP GENERATION SECTION
//---------------------------------------------------------------------------

/** Map generator for the roguelike game.*/
RG.RogueMapGen = function() {

    this.cols = 50;
    this.rows = 30;
    var _mapGen = new ROT.Map.Arena(50, 30);

    this.setGen = function(type, cols, rows) {
        this.cols = cols;
        this.rows = rows;
        type = type.toLowerCase();
        switch(type) {
            case "arena":  _mapGen = new ROT.Map.Arena(cols, rows); break;
            case "cellular":  _mapGen = new ROT.Map.Cellular(cols, rows); break;
            case "divided":  _mapGen = new ROT.Map.DividedMaze(cols, rows); break;
            case "eller":  _mapGen = new ROT.Map.EllerMaze(cols, rows); break;
            case "digger":  _mapGen = new ROT.Map.Digger(cols, rows); break;
            default: RG.err("MapGen", "setGen", "_mapGen type " + type + " is unknown");
        }
    };

    this.getMap = function() {
        var map = new Map(this.cols, this.rows);
        _mapGen.create(function(x, y, val) {
            map.setXY(x, y, val > 0 ? true: false);
        });
        return map;
    };

};

var MapCell = function(x, y, val) {

    var cellVal = val;
    var cellX   = x;
    var cellY   = y;

    this.setVal = function(val) {
        cellVal = val;
    };

    this.getVal = function() {
        return cellVal;
    };

    this.isFree = function() {
        return cellVal === 0;
    };

    this.setProp = function(prop, obj) {
        if (this.hasOwnProperty(prop)) {
            this[prop].push(obj);
        }
        else {
            RG.err("MapCell", "setProp", "No property " + prop);
        }
    };

    this.hasProp = function(prop) {
        if (this.hasOwnProperty(prop)) {
            return this[prop].length > 0;
        }
    };

    this.getProp = function(prop) {
        if (this.hasOwnProperty(prop)) {
            return this[prop];
        }
        return null;

    };

    // Cell can have different properties
    this.items    = [];
    this.actors   = [];
    this.elements = [];
    this.traps    = [];

};

/** Map object which contains a number of cells. A map is used for rendering
 * while the level contains actual information about game elements such as
 * monsters and items. */
var Map = function(cols, rows) {
    var map = [];
    this.cols = cols;
    this.rows = rows;

    for (var x = 0; x < this.cols; x++) {
        map.push([]);
        for (var y = 0; y < this.rows; y++) {
            map[x].push(new MapCell(x, y, 0));
        }
    }

    /** Sets a property for the underlying cell.*/
    this.setProp = function(x, y, prop, obj) {
        map[x][y].setProp(prop, obj);
    };

    this.setXY = function(x, y, val) {
        map[x][y].setVal(val);
    };

    this.getXY = function(x, y) {
        return map[x][y].getVal();
    };

    this.getRow = function(y) {
        var row = [];
        for (var i = 0; i < this.cols; ++i) {
            row.push(map[i][y].getVal());
        }
        return row;
    };

    this.getCellRow = function(y) {
        var row = [];
        for (var i = 0; i < this.cols; ++i) {
            row.push(map[i][y]);
        }
        return row;
    };

    /** Returns all free cells in the map.*/
    this.getFree = function() {
        var freeCells = [];
        for (var x = 0; x < this.cols; x++) {
            for (var y = 0; y < this.rows; y++) {
                if (map[x][y].isFree()) {
                    freeCells.push([x, y]);
                }
            }
        }
        return freeCells;
    };

};

if ($NODE) {
    module.exports = RG;
}
