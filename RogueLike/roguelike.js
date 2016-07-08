/*
 * Contains the main object "RoguelikeGame", the top-level game object.
 */

var has_require = typeof require !== 'undefined';

if (typeof window !== 'undefined') {
    var ROT = window.ROT;
}

if (typeof ROT === 'undefined' ) {
    if (has_require) {
      ROT = require('./rot.js');
    }
    else throw new Error('roguelike requires ROT');
}

var RG = {

    IdCount: 0,

    cellPropRenderOrder: ['actors', 'items', 'traps', 'elements'],

    /** Maps a cell to specific class in stylesheet. For rendering purposes
     * only.*/
    getStyleClassForCell: function(cell) {
        for (var i = 0; i < this.cellPropRenderOrder.length; i++) {
            var type = this.cellPropRenderOrder[i];
            if (cell.hasProp(type)) {
                var props = cell.getProp(type);
                var styles = this.cellStyles[type];
                console.log("Type is " + type);
                var propType = props[0].getType();
                console.log("propType is " + propType);
                if (styles.hasOwnProperty(propType)) {
                    return styles[propType];
                }
                else {
                    return styles["default"];
                }
            }
            else { // class based on Base element
                type = cell.getBaseElem().getType();
                return this.cellStyles.elements[type];
            }
        }
        return "";
    },

    cellStyles: {
        elements: {
            "default": "cell-elements",
            wall: "cell-element-wall",
            floor: "cell-element-floor",
        },
        actors: {
            "default": "cell-actors",
        },
        items: {
            "default": "cell-items",
        },
        traps: {
            "default": "cell-traps",
        },
    },

    debug: function(msg) {
        console.log("[DEBUG]: " + msg);
    },

    err: function(obj, fun, msg) {
        console.error(obj + ": " + fun + " -> " + msg);
    },


    extend2: function(Child, Parent) {
        var p = Parent.prototype;
        var c = Child.prototype;
        for (var i in p) {
            c[i] = p[i];
        }
        c.uber = p;
    },

    nullOrUndefError: function(obj, msg, val) {
        if (val === null || typeof val === "undefined") {
            var type = typeof obj;
            console.error("nullOrUndefError: " + type + ": " + msg);

        }
    },
};

RG.Locatable = function() {
    var _x;
    var _y;
    var _level;
    var _type;

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
        if (_level !== obj.getLevel()) return false;
        return true;
    };

    this.setLevel = function(level) {
        _level = level;
    };

    this.getLevel = function() {
        return _level;
    };

    this.setType = function(type) {
        _type = type;
        RG.nullOrUndefError(this, "arg type", type);
    };

    this.getType = function() {
        return _type;
    };

};

/** Top-level object for the game. */
RG.RogueGame = function() {

    var _players = [];
    var _levels = [];
    var _activeLevels = [];
    var _time = "";

    var _scheduler = new RG.RogueScheduler();
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
        _scheduler.setAction(action);
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

    this.moveActorTo = function(actor, x, y) {
        var level = actor.getLevel();
        level.moveActorTo(actor, x, y);
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

    /** Returns all properties in given location.*/
    this.getProps = function(x, y) {

    };

    this.addActor = function(actor, x, y) {
        if (actor instanceof RG.RogueActor) {
            _actors.push(actor);
            actor.setLevel(this);
            if (x !== null && y !== null) {
                _map.setProp(x, y, "actors", actor);
                actor.setXY(x, y);
                RG.debug("Added actor to map x: " + x + " y: " + y);
            }
            else {

            }
        }
    };

    this.moveActorTo = function(actor, x, y) {
        var index = _actors.indexOf(actor);
        var cell = _map.getCell(x, y);
        console.log("Index is " + index);
        if (cell.isFree()) {
            if (index >= 0) {
                var xOld = actor.getX();
                var yOld = actor.getY();
                console.log("Trying to move actor from " + x + ", " + y);
                if (_map.removeProp(xOld, yOld, "actors", actor)) {
                    _map.setProp(x, y, "actors", actor);
                    actor.setXY(x, y);
                    console.log("set actor x,y" + x + ", " + y);
                    return true;
                }
                else {
                    RG.err("Level", "moveActorTo", "Couldn't remove actor.");
                }
            }
        }
        else {
            console.log("Cell wasn't free at " + x + ", " + y);

        }
        return false;
    };

};

RG.RogueActor = function(isPlayer) {
    RG.Locatable.call(this);
    this.setType("actors");
    var _actions = [];
    var _brain = null;
    var _isPlayer = isPlayer === undefined ? false : isPlayer;
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

};

//RG.RogueActor.extend(RG.Locatable);
RG.extend2(RG.RogueActor, RG.Locatable);

/** Element is a wall or other obstacle or a feature in the map. It's not
 * necessarily blocking movement.
 */
RG.RogueElement = function(elemType) {
    RG.Locatable.call(this);
    this.setType(elemType);

    var _elemType = elemType.toLowerCase();
    var _allowMove;
    switch(elemType) {
        case "wall": _allowMove = false; break;
        case "floor": _allowMove = true; break;
    }

    this.canMove = function() {
        return _allowMove;
    };

};
RG.extend2(RG.RogueElement, RG.Locatable);

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

/** Scheduler for the game actions. */
RG.RogueScheduler = function() {

    // Internally use ROT scheduler
    var _scheduler = new ROT.Scheduler.Action();

    this.add = function(actor, repeat, offset) {
        _scheduler.add(actor, repeat, offset);
    };

    // Returns null if no next actor exists.
    this.next = function() {
        return _scheduler.next();
    };

    this.setAction = function(action) {
        _scheduler.setDuration(action.getDuration());
    };

    /** Tries to remove an actor, Return true if success.*/
    this.remove = function(actor) {
        return _scheduler.remove(actor);
    };

    this.getTime = function() {
        return _scheduler.getTime();
    };


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

    /** Returns a randomized map based on initialized generator settings.*/
    this.getMap = function() {
        var map = new RG.Map(this.cols, this.rows);
        _mapGen.create(function(x, y, val) {
            if (val > 0) {
                map.setBaseElemXY(x, y, new RG.RogueElement("wall"));
            }
            else if (val === 0) {
                map.setBaseElemXY(x, y, new RG.RogueElement("floor"));
            }
        });
        return map;
    };

};

RG.MapCell = function(x, y, elem) {

    var _baseElem = elem;
    var _x   = x;
    var _y   = y;

    // Cell can have different properties
    var _p = {
        items: [],
        actors   : [],
        elements : [],
        traps    : [],
    };

    this.setBaseElem = function(elem) {
        _baseElem = elem;
    };

    this.getBaseElem = function() {
        return _baseElem;
    };

    this.isFree = function() {
        return _baseElem.getType() !== "wall";
    };

    this.setProp = function(prop, obj) {
        if (_p.hasOwnProperty(prop)) {
            _p[prop].push(obj);
        }
        else {
            RG.err("MapCell", "setProp", "No property " + prop);
        }
    };

    /** Removes the given object from cell properties.*/
    this.removeProp = function(prop, obj) {
        if (this.hasProp(prop)) {
            var props = _p[prop];
            var index = props.indexOf(obj);
            if (index === -1) return false;
            _p[prop].splice(index, 1);
            return true;
        }
        return false;
    };

    this.hasProp = function(prop) {
        if (_p.hasOwnProperty(prop)) {
            return _p[prop].length > 0;
        }
    };

    /** Returns true if any cell property has the given type. Ie.
     * myCell.hasPropType("wall")
     */
    this.hasPropType = function(propType) {
        if (_baseElem.getType() === propType) return true;
        for (var prop in _p) {
            var arrProps = _p[prop];
            for (var i = 0; i < arrProps.length; i++) {
                if (arrProps[i].getType() === propType) {
                    console.log("Returning true for propType " + propType);
                    return true;
                }
            }
        }
        console.log("Returning false for propType " + propType);
        return false;
    };

    this.getProp = function(prop) {
        if (_p.hasOwnProperty(prop)) {
            return _p[prop];
        }
        return null;

    };


};

/** Map object which contains a number of cells. A map is used for rendering
 * while the level contains actual information about game elements such as
 * monsters and items. */
RG.Map = function(cols, rows) {
    var map = [];
    this.cols = cols;
    this.rows = rows;

    for (var x = 0; x < this.cols; x++) {
        map.push([]);
        for (var y = 0; y < this.rows; y++) {
            map[x].push(new RG.MapCell(x, y, 0));
        }
    }

    /** Sets a property for the underlying cell.*/
    this.setProp = function(x, y, prop, obj) {
        map[x][y].setProp(prop, obj);
    };

    this.removeProp = function(x, y, prop, obj) {
        return map[x][y].removeProp(prop, obj);
    };

    this.setBaseElemXY = function(x, y, elem) {
        map[x][y].setBaseElem(elem);
    };

    this.getBaseElemXY = function(x, y) {
        return map[x][y].getBaseElem();
    };

    this.getCell = function(x, y) {
        return map[x][y];
    };

    this.getBaseElemRow = function(y) {
        var row = [];
        for (var i = 0; i < this.cols; ++i) {
            row.push(map[i][y].getBaseElem());
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

if ( typeof exports !== 'undefined' ) {
    if( typeof RG !== 'undefined' && module.exports ) {
        exports = module.exports = RG;
    }
    exports.RG = RG;
}
else {
    window.RG = RG;
}
