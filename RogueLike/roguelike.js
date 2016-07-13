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
        if (!cell.isExplored()) return "cell-not-explored";
        for (var i = 0; i < this.cellPropRenderOrder.length; i++) {
            var type = this.cellPropRenderOrder[i];
            if (cell.hasProp(type)) {
                var props = cell.getProp(type);
                var styles = this.cellStyles[type];
                //console.log("Type is " + type);
                var propType = props[0].getType();
                //console.log("propType is " + propType);
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
            "player": "cell-player",
            "monster": "cell-monster",
            "default": "cell-actors",
        },
        items: {
            "default": "cell-items",
        },
        traps: {
            "default": "cell-traps",
        },
    },

    debug: function(obj, msg) {
        var inst = typeof obj;
        console.log("[DEBUG]: " + inst + " " + msg);
    },

    err: function(obj, fun, msg) {
        console.error("[ERROR]: " + obj + ": " + fun + " -> " + msg);
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

    isNullOrUndef: function(list) {
        for (var i = 0; i < list.length; i++) {
            if (list[i] === null || typeof list[i] === "undefined" ||
                list === undefined) {
                return true;
            }
        }
        return false;
    },

    // Default FOV range for actors
    FOV_RANGE: 5,
    ROWS: 30,
    COLS: 50,
};

/** This class is used by all locatable objects in the game.*/
RG.Locatable = function() {
    var _x = null;
    var _y = null;
    var _level = null;
    var _type = null;

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

    this.isLocated = function() {
        return (_x !== null) && (_y !== null) && (_level !== null);
    };

    /** Returns true if locatables are in same position.*/
    this.isSamePos = function(obj) {
        if (_x !== obj.getX()) return false;
        if (_y !== obj.getY()) return false;
        if (_level !== obj.getLevel()) return false;
        return true;
    };

    this.setLevel = function(level) {
        _level = level;
        RG.nullOrUndefError(this, "arg |level|", level);
    };

    this.getLevel = function() {
        return _level;
    };

    this.setType = function(type) {
        _type = type;
        RG.nullOrUndefError(this, "arg |type|", type);
    };

    this.getType = function() {
        return _type;
    };

};

/** Top-level object for the game. */
RG.RogueGame = function() {

    var _cols = RG.COLS;
    var _rows = RG.ROWS;

    var _players      = [];
    var _levels       = [];
    var _activeLevels = [];
    var _shownLevel   = null;
    var _time         = "";
    var _gameOver     = false;

    var _scheduler = new RG.RogueScheduler();
    var _mapGen = new RG.RogueMapGen();

    var _initDone = false;
    this.initGame = function() {
        if (!_initDone) {

        }
    };

    /** Move actor to level n. */
    this.moveToLevel = function(actor, nlevel) {
        if (nlevel === _levels.length) {
            this.createNewLevel(_cols, _rows);
        }
        else if (nlevel > _levels.length) {
            RG.err("Game", "moveToLevel", "Level " + nlevel + "doesn't exist.");
        }
        else {
            //TODO move to existing level

        }
    };

    /** Creates a new level and adds it to the game. */
    this.createNewLevel = function(cols, rows) {
        var map = _mapgen.getMap();
        var level = new RG.RogueLevel(cols, rows);
        level.setMap(map);
        _levels.push(level);
    };

    this.shownLevel = function() {
        return _shownLevel;
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

    /** Adds player to the game. By default, it's added to the first level.*/
    this.addPlayer = function(player) {
        if (_levels.length > 0) {
            if (_levels[0].addActorToFreeCell(player)) {
                _players.push(player);
                _scheduler.add(player, true, 0);
                if (_shownLevel === null) {
                    _shownLevel = _levels[0];
                }
                RG.debug(this, "Added a player to the Game.");
                return true;
            }
            else {
                RG.err("Game", "addPlayer", "Failed to add the player.");
                return false;
            }
        }
        else {
            RG.err("Game", "addPlayer", "No levels exist. Cannot add player.");
        }
        return false;
    };

    this.addActorToLevel = function(actor, level) {
        var index = _levels.indexOf(level);
        if (index >= 0) {
            if (_levels[0].addActorToFreeCell(actor)) {
                _scheduler.add(actor, true, 0);
                return true;
            }
            else {
                RG.err("Game", "addActorToLevel", "Failed to add the actor.");
            }
        }
        else {
            RG.err("Game", "actorToLevel", "No level exist. Cannot add actor.");
        }
        return false;
    };

    this.playerTookAction = function(dur) {
        var action = new RG.RogueAction(function(){}, 100, {});
        _scheduler.setAction(action);
    };

    this.doAction = function(action) {
        _scheduler.setAction(action);
        action.doAction();
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

    /** Returns all properties in a given location.*/
    this.getProps = function(x, y) {
        if (!RG.isNullOrUndef([x, y])) {

        }
        else {
            RG.nullOrUndefError(this, "arg |x|", x);
            RG.nullOrUndefError(this, "arg |y|", y);
            return null;
        }
    };

    /** Adds an actor to the level. If x,y is given, tries to add there. If not,
     * finds first free cells and adds there. Returns true on success.
     */
    this.addActor = function(actor, x, y) {
        RG.debug(this, "addActor called with x,y " + x + ", " + y);
        if (!RG.isNullOrUndef([x, y])) {
            if (_map.hasXY(x, y)) {
                this._addActorToLevel(actor, x, y);
                RG.debug(this, "Added actor to map x: " + x + " y: " + y);
                return true;
            }
            else {
                RG.err("Level", "addActor", "No coordinates " + x + ", " + y + " in the map.");
                return false;
            }
        }
        else {
            RG.nullOrUndefError(this, "arg |x|", x);
            RG.nullOrUndefError(this, "arg |y|", y);
            return false;
        }
    };

    /** USing this method, actor can be added to a free cell without knowing the
     * exact x,y coordinates.*/
    this.addActorToFreeCell = function(actor) {
        RG.debug(this, "Adding actor to free slot");
        var freeCells = _map.getFree();
        if (freeCells.length > 0) {
            var xCell = freeCells[0].getX();
            var yCell = freeCells[0].getY();
            this._addActorToLevelXY(actor, xCell, yCell);
            RG.debug(this, "Added actor to free cell in " + xCell + ", " + yCell);
            return true;
        }
        else {
            RG.err("Level", "addActor", "No free cells for the actor.");
            return false;
        }
    };

    this._addActorToLevelXY = function(actor, x, y) {
        _actors.push(actor);
        actor.setXY(x,y);
        actor.setLevel(this);
        _map.setProp(x, y, "actors", actor);
    };

    /** Moves actor to x,y if possible and returns true. Returns false
     * otherwise.*/
    this.moveActorTo = function(actor, x, y) {
        var index = _actors.indexOf(actor);
        var cell = _map.getCell(x, y);
        RG.debug(this, "moveActorTo: Index is " + index);
        if (cell.isFree()) {
            if (index >= 0) {
                var xOld = actor.getX();
                var yOld = actor.getY();
                RG.debug(this, "Trying to move actor from " + xOld + ", " + yOld);

                if (_map.removeProp(xOld, yOld, "actors", actor)) {
                    console.log("About to setProp set actor x,y " + x + ", " + y);
                    _map.setProp(x, y, "actors", actor);
                    actor.setXY(x, y);
                    console.log("set actor succesfully to x,y " + x + ", " + y);
                    return true;
                }
                else {
                    RG.err("Level", "moveActorTo", "Couldn't remove actor.");
                }
            }
        }
        else {
            RG.debug(this, "Cell wasn't free at " + x + ", " + y);
        }
        return false;
    };

    /** Explores the level from given actor's viewpoint. Sets new cells as
     * explored. There's no exploration tracking per actor.*/
    this.exploreCells = function(actor) {
        var visibleCells = _map.getVisibleCells(actor);
        if (actor.isPlayer()) {
            for (var i = 0; i < visibleCells.length; i++) {
                visibleCells[i].setExplored();
            }
        }
        return visibleCells;
    };

    /** Returns all explored cells in the map.*/
    this.getExploredCells = function() {
        return _map.getExploredCells();
    };

};

RG.RogueActor = function(isPlayer) {
    RG.Locatable.call(this);
    this.setType("actors");
    var _actions = [];
    var _brain = null;
    var _isPlayer = isPlayer === undefined ? false : isPlayer;
    this.id = RG.IdCount++;

    if (!isPlayer) {
        _brain = new RG.RogueBrain();

    }

    /** Returns true if actor is a player.*/
    this.isPlayer = function() {
        return _isPlayer;
    };

    this.nextAction = function() {
        if (_isPlayer) {
            // Wait for key event

        }
        else {
            // Use AI brain to determine the action
            console.log("Monster takes a turn.");
            var cb = _brain.decideNextAction(this);
            return new RG.RogueAction(100, cb, {});
        }
    };

    this.getFOVRange = function() {
        return RG.FOV_RANGE;
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
RG.RogueAction = function(dur, cb, obj) {

    var _duration = dur;

    var _cb = cb; // Action callback

    this.setCb = function(cb) {
        _cb = cb;
    };

    this.getDuration = function() {
        return _duration;
    };

    this.doAction = function() {
        _cb(obj);
    };

};

/** Brain is used by the AI to perform and decide on actions.*/
RG.RogueBrain = function() {

    this.decideNextAction = function(actor) {
        var level = actor.getLevel();
        var cells = level.getMap().getVisibleCells(actor);
        var index = -1;
        for (var i = 0; i < cells.length; i++) {
            if (cells[i].isFree()) {
                index = i;
                break;
            }
        }

        return function() {
            var x = cells[index].getX();
            var y = cells[index].getY();
            level.moveActorTo(actor, x, y);
        };
    };

};

RG.ZombieBrain = function() {
    RG.RogueBrain.call(this);

};
RG.extend2(RG.ZombieBrain, RG.RogueBrain);



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
            else {
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
    var _explored = false;

    // Cell can have different properties
    var _p = {
        items: [],
        actors   : [],
        elements : [],
        traps    : [],
    };

    this.getX = function() {return _x;};
    this.getY = function() {return _y;};

    /** Sets the base element for this cell.*/
    this.setBaseElem = function(elem) {
        _baseElem = elem;
    };

    this.getBaseElem = function() {
        return _baseElem;
    };

    /** Returns true if it's possible to move to this cell.*/
    this.isFree = function() {
        return _baseElem.getType() !== "wall" &&
            !this.hasProp("actors");
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

    this.lightPasses = function() {
        if (_baseElem.getType() === "wall") return false;
        return true;
    };

    this.setExplored = function() {
        _explored = true;
    };

    this.isExplored = function() {
        return _explored;
    };

    this.toString = function() {
        var str = "MapCell " + _x + ", " + _y;
        str += " explored: " + _explored;
        str += " passes light: " + this.lightPasses();
        return str;
    };

};

/** Map object which contains a number of cells. A map is used for rendering
 * while the level contains actual information about game elements such as
 * monsters and items. */
RG.Map = function(cols, rows) {
    var map = [];
    this.cols = cols;
    this.rows = rows;

    var _cols = cols;
    var _rows = rows;

    for (var x = 0; x < this.cols; x++) {
        map.push([]);
        for (var y = 0; y < this.rows; y++) {
            var elem = new RG.RogueElement("floor");
            map[x].push(new RG.MapCell(x, y, elem));
        }
    }

    /** Returns true if x,y are in the map.*/
    this.hasXY = function(x, y) {
        return (x >= 0) && (x < this.cols) && (y >= 0) && (y < this.rows);
        //return x < this.cols && y < this.rows;
    };

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
                    freeCells.push(map[x][y]);
                }
            }
        }
        return freeCells;
    };

    var _hasXY = function(x, y) {
        return (x >= 0) && (x < _cols) && (y >= 0) && (y < _rows);
    };

    var lightPasses = function(x, y) {
        if (_hasXY(x, y)) {
            return map[x][y].lightPasses(); // delegate to cell
        }
        return false;
    };


    /** Returns visible cells for given actor.*/
    this.getVisibleCells = function(actor) {
        var cells = [];
        var fov = new ROT.FOV.PreciseShadowcasting(lightPasses);
        var x = actor.getX();
        var y = actor.getY();
        if (actor.isLocated()) {
            if (actor.getLevel().getMap() === this) {
                var range = actor.getFOVRange();
                fov.compute(x, y, range, function(x, y, r, visibility) {
                    //console.log(x + "," + y + " r: " + r + "vis: " + visibility);
                    if (visibility) {
                        if (_hasXY(x, y)) {
                            //console.log(map[x][y].toString());
                            cells.push(map[x][y]);
                        }
                    }
                });
            }
        }
        return cells;
    };

    this.getExploredCells = function() {
        var cells = [];
        for (var x = 0; x < this.cols; x++) {
            for (var y = 0; y < this.rows; y++) {
                if (map[x][y].isExplored()) {
                    cells.push(map[x][y]);
                }
            }
        }
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
