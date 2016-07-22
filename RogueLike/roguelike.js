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

/** Main object of the package for encapsulating all other objects. */
var RG = { // {{{2 

    IdCount: 0,

    cellPropRenderOrder: ['actors', 'items', 'traps', 'elements'],

    /** Maps a cell to specific object in stylesheet. For rendering purposes
     * only.*/
    getStyleClassForCell: function(cell) {
        if (!cell.isExplored()) return "cell-not-explored";
        for (var i = 0; i < this.cellPropRenderOrder.length; i++) {
            var type = this.cellPropRenderOrder[i];
            if (cell.hasProp(type)) {
                var props = cell.getProp(type);
                var styles = this.cellStyles[type];
                var propType = props[0].getType();
                if (styles.hasOwnProperty(propType)) {
                    return styles[propType];
                }
                else {
                    return styles["default"];
                }
            }
        }

        var baseType = cell.getBaseElem().getType();
        return this.cellStyles.elements[baseType];
    },

    getCellChar: function(cell) {
        if (!cell.isExplored()) return "";
        //if (cell.hasProp("items")) return "(";
        //if (cell.hasProp("actors")) return "@";
        return "";
    },

    shortestDist: function(x0, y0, x1, y1) {
        var coords = [];
        var result = 0;
        var passableCallback = function(x, y) {return true;};
        var finder = new ROT.Path.Dijkstra(x0, y0, passableCallback);
        finder.compute(x1, y1, function(x, y) {
            ++result;
        });
        return result - 1; // Subtract one because starting cell included
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
            if (!c.hasOwnProperty(i)) {
                c[i] = p[i];
            }
            else {
                console.log(i + " overridden in the child class.");
            }
        }
        if (c.hasOwnProperty("uber")) {
            var ubers = [c.uber];
            ubers.push(p);
            c.uber = ubers;
        }
        else {
            c.uber = p;
        }
    },

    /** Prints an error into console if 'val' is null or undefined.*/
    nullOrUndefError: function(obj, msg, val) {
        if (this.isNullOrUndef([val])) {
            var type = typeof obj;
            console.error("nullOrUndefError: " + type + ": " + msg);
        }
    },

    /** Returns true if anything in the list is null or undefined.*/
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
    ACTION_DUR: 100,
    DEFAULT_HP: 50,

    // Different game events
    EVT_ACTOR_KILLED: "EVT_ACTOR_KILLED",
    EVT_MSG: "EVT_MSG",
}; /// }}} RG


RG.TypedObject = function(type) {
    var _type = type;

    this.setType = function(type) {
        _type = type;
        RG.nullOrUndefError(this, "arg |type|", type);
    };

    this.getType = function() {
        return _type;
    };

};

/** This object is used by all locatable objects in the game.  */
RG.Locatable = function() { // {{{2
    RG.TypedObject.call(this, null);
    var _x = null;
    var _y = null;
    var _level = null;

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

    /** Returns true if object is located at a position on a level.*/
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

    /** Sets the level of this locatable object.*/
    this.setLevel = function(level) {
        _level = level;
        RG.nullOrUndefError(this, "arg |level|", level);
    };

    this.getLevel = function() {
        return _level;
    };


}; // }}} Locatable
RG.extend2(RG.Locatable, RG.TypedObject);

/** Ownable is sort of Locatable but it moves with its owner. This ensures that
 * for example item coordinates are up-to-date with the carrier.*/
RG.Ownable = function(owner) {
    RG.TypedObject.call(this, null);
    var _owner = owner;

    this.isSamePos = function(obj) {return _owner.isSamePos(obj);};

    this.getLevel = function() {return _owner.getLevel();};

    this.setOwner = function(owner) {
        if (RG.isNullOrUndef(owner)) {
            RG.err("Item", "setOwner", "Owner cannot be null.");
        }
        else {
            _owner = owner;
        }
    };
    this.getOwner = function() {return _owner;};

    this.getX = function() {
        if (_owner !== null) return _owner.getX();
        return null;
    };

    this.getY = function() {
        if (_owner !== null) return _owner.getY();
        return null;
    };

    this.getLevel = function() {
        if (_owner !== null) return _owner.getLevel();
        return null;
    };

};
RG.extend2(RG.Ownable, RG.TypedObject);

/** Event pool can be used to emit events and register callbacks for listeners.
 * This decouples the emitter and listener from each other.  */
RG.EventPool = function() { // {{{2

    var _listeners = {};
    var _eventsNoListener = 0;

    /** Emits an event with given name. args must be in object-notation ie.
     * {data: "abcd"} */
    this.emitEvent = function (evtName, args) {
        if (_listeners.hasOwnProperty(evtName)) {
            var called = _listeners[evtName];
            for (var i = 0; i < called.length; i++) {
                called[i].notify(evtName, args);
            }
        }
        else {
            ++_eventsNoListener;
        }
    };

    /** Register an event listener. */
    this.listenEvent = function(evtName, obj) {
        if (obj.hasOwnProperty("notify")) {
            if (_listeners.hasOwnProperty(evtName)) {
                _listeners[evtName].push(obj);
            }
            else {
                _listeners[evtName] = [];
                _listeners[evtName].push(obj);
            }
        }
        else {
            console.error("Cannot add object. Listener must implement notify()!");
        }
    };
};
RG.POOL = new RG.EventPool(); // Global event pool for the game }}}

/** Handle the game message listening and storing of the messages.  */
RG.Messages = function() { // {{{2
    var _message = [];

    this.notify = function(evtName, msg) {
        if (evtName === RG.EVT_MSG) {
            if (msg.hasOwnProperty("msg")) {
                _message.push(msg.msg);
            }
        }
    };
    RG.POOL.listenEvent(RG.EVT_MSG, this);

    this.getMessages = function() {
        return _message.join(".");
    };

    this.clear = function() {
        _message = [];
    };

}; // }}} Messages

/** Top-level object for the game.  */
RG.RogueGame = function() { // {{{2

    var _cols = RG.COLS;
    var _rows = RG.ROWS;

    var _players      = [];
    var _levels       = [];
    var _activeLevels = [];
    var _shownLevel   = null;
    var _time         = "";
    var _gameOver     = false;

    var _mapGen = new RG.RogueMapGen();
    var _scheduler = new RG.RogueScheduler();
    var _msg = new RG.Messages();

    var _initDone = false;
    this.initGame = function() {
        if (!_initDone) {

        }
    };

    this.getMessages = function() {
        return _msg.getMessages();
    };

    this.clearMessages = function() {
        _msg.clear();
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
        return level.moveActorTo(actor, x, y);
    };

    this.notify = function(evtName, args) {
        if (evtName === RG.EVT_ACTOR_KILLED) {
            if (args.actor.isPlayer()) {
                if (_players.length === 1) {
                    _gameOver = true;
                    RG.POOL.emitEvent(RG.EVT_MSG, {msg: "GAME OVER!"});
                    console.log("Emitted game over!");
                }
            }
        }
    };
    RG.POOL.listenEvent(RG.EVT_ACTOR_KILLED, this);

}; // }}} Game

/** Object for the game levels. Contains map, actors and items.  */
RG.RogueLevel = function(cols, rows) { // {{{2
    var _actors = [];
    var _map = null;

    // Level properties
    var _p = {
        actors: [],
        items:  [],
        elements: [],
    };

    this.setMap = function(map) {
        _map = map;
    };
    this.getMap = function() {
        return _map;
    };

    /** Returns all properties in a given location.*/
    this.getProps = function(x, y) {
        if (!RG.isNullOrUndef([x, y])) {
            console.error("getProps in RogueLevel not implemented.");
        }
        else {
            RG.nullOrUndefError(this, "arg |x|", x);
            RG.nullOrUndefError(this, "arg |y|", y);
            return null;
        }
    };

    // ITEM RELATED FUNCTIONS

    this.addItem = function(item, x, y) {
        if (!RG.isNullOrUndef([x, y])) {
            return this._addPropToLevelXY("items", item, x, y);
        }
        else {
            var freeCells = _map.getFree();
            if (freeCells.length > 0) {
                var xCell = freeCells[0].getX();
                var yCell = freeCells[0].getY();
                return this._addPropToLevelXY("items", item, xCell, yCell);
            }

        }
        return false;
    };

    this.removeItem = function(item, x, y) {
        return _map.removeProp(x, y, "items", item);
    };

    this.pickupItem = function(actor, x, y) {
        var cell = _map.getCell(x, y);
        if (cell.hasProp("items")) {
            RG.POOL.emitEvent(RG.EVT_MSG, {msg: "You try to pickup but cannot. Too weak!"});
        }
        else {
            RG.POOL.emitEvent(RG.EVT_MSG, {msg: "Nothing to pickup!"});
        }
    };

    /** Adds an actor to the level. If x,y is given, tries to add there. If not,
     * finds first free cells and adds there. Returns true on success.
     */
    this.addActor = function(actor, x, y) {
        RG.debug(this, "addActor called with x,y " + x + ", " + y);
        if (!RG.isNullOrUndef([x, y])) {
            if (_map.hasXY(x, y)) {
                this._addPropToLevelXY("actors", actor, x, y);
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
            if (this._addPropToLevelXY("actors", actor, xCell, yCell)) {
                RG.debug(this, "Added actor to free cell in " + xCell + ", " + yCell);
                return true;
            }
        }
        else {
            RG.err("Level", "addActor", "No free cells for the actor.");
        }
        return false;
    };

    this._addPropToLevelXY = function(propType, obj, x, y) {
        if (_p.hasOwnProperty(propType)) {
            _p[propType].push(obj);
            obj.setXY(x,y);
            obj.setLevel(this);
            _map.setProp(x, y, propType, obj);
            return true;
        }
        else {
            RG.err("Level", "_addPropToLevelXY", "No property " + propType);
        }
        return false;
    };

    /** Moves actor to x,y if possible and returns true. Returns false
     * otherwise.*/
    this.moveActorTo = function(actor, x, y) {
        var index = _p.actors.indexOf(actor);
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

    /** Given actor attacks square x,y.*/
    this.attackWith = function(actor, x, y) {
        var cell = _map.getCell(x, y);
        if (cell.hasProp("actors")) {
            var target = cell.getProp("actors")[0];
            var combat = new RG.RogueCombat(actor, target);
            combat.fight();
            console.log("Actor attacks at " + x + ", " + y);
            return true;
        }
    };

    this.removeActor = function(actor) {
        var index = _p.actors.indexOf(actor);
        var x = actor.getX();
        var y = actor.getY();
        if (_map.removeProp(x, y, "actors", actor)) {
            _p.actors.splice(index, 1);
            return true;
        }
        else {
            return false;

        }
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

}; // }}} Level

/** Combatant object can be used for all actors and objects involved in
 * combat. */
RG.Combatant = function(hp) { // {{{2

    //console.log("Combatant constructor got HP '" + hp + "'");

    var _maxHP = hp;
    var _hp = hp;

    var _attack = 10;
    var _defense = 5;
    var _exp = 0;
    var _expLevel = 1;

    this.getHP = function() {return _hp;};
    this.setHP = function(hp) {_hp = hp;};
    this.getMaxHP = function() {return _maxHP;};
    this.setMaxHP = function(hp) {_maxHP = hp;};

    this.isAlive = function() {
        return _hp > 0;
    };

    this.getAttack = function() {
        return _attack;
    };

    this.setAttack = function(attack) {
        _attack = attack;
    };

    this.getDefense = function() {
        return _defense;
    };

    this.setDefense = function(defense) {
        _defense = defense;
    };

    this.getAttackRange = function() {
        return 1;
    };

    this.setExp = function(exp) {_exp = exp;};
    this.getExp = function() {return _exp;};
    this.setExpLevel = function(expLevel) {_expLevel = expLevel;};
    this.getExpLevel = function() {return _expLevel;};

}; // }}} Combatant

/** Object representing a combat betweent two actors.  */
RG.RogueCombat = function(att, def) { // {{{2

    var _att = att;
    var _def = def;

    this.fight = function() {
        var attackPoints = _att.getAttack();
        var defPoints = _def.getDefense();
        var diff = attackPoints - defPoints;
        RG.POOL.emitEvent(RG.EVT_MSG, {msg: _att.getName() + " attacks " + _def.getName()});
        if (diff > 0) {
            this.doDamage(_def, diff);
        }
    };

    this.doDamage = function(def, dmg) {
        def.setHP(def.getHP() - dmg);
        if (!def.isAlive()) {
            this.killActor(def);
        }
        else {
            RG.POOL.emitEvent(RG.EVT_MSG, {msg:_def.getName() + " got " + dmg + " damage."});
        }
    };

    this.killActor = function(actor) {
        var level = actor.getLevel();
        if (level.removeActor(actor)) {
            this.giveExp(_att);
            RG.POOL.emitEvent(RG.EVT_MSG, {msg: _def.getName() + " was killed."});
            RG.POOL.emitEvent(RG.EVT_ACTOR_KILLED, {actor: actor});
        }
        else {
            RG.err("Combat", "killActor", "Couldn't kill actor");
        }
    };

    /** Give some experience points.*/
    this.giveExp = function(att) {

    };

}; // }}} Combat

/** Models an item. Each item is ownable by someone. During game, there are no
 * items with null owners. Ownership shouldn't be ever set to null. */
RG.RogueItem = function(type) {
    RG.Ownable.call(this, null);
    this.setType("items");

    var _itemType = type;
    var _weight = 1;
    var _p = {}; // Stores all extra properties

    this.getItemType = function() {
        return _itemType;
    };

    this.hasProp = function(propName) {
        return _p.hasOwnProperty(propName);
    };

    this.getProp = function(propName) {
        if (_p.hasOwnProperty(propName)) {
            return _p[propName];
        }
        else {
            return null;
        }
    };

    this.setWeight = function(weight) {_weight = weight;};
    this.getWeight = function() {return weight;};



};
RG.extend2(RG.RogueItem, RG.Ownable);

/** Models an item container. Can hold a number of items.*/
RG.RogueItemContainer = function(owner) {
    RG.RogueItem.call(this, "container");
    this.setOwner(owner);

    var _items = [];
    var _iter  = 0;

    /** Adds an item. Container becomes item's owner.*/
    this.addItem = function(item) {
        if (item.getItemType() === "container") {
            if (this.getOwner() !== item) {
                item.setOwner(this);
                _items.push(item);
            }
            else {
                RG.err("Item", "addItem", "Added item is container's owner. Impossible.");
            }
        }
        else {
            item.setOwner(this);
            _items.push(item);
        }
    };

    this.getItems = function() {return _items;};

    this.hasItem = function(item) {
        var index = _items.indexOf(item);
        if (index !== -1) return true;
        return false;
    };

    this.removeItem = function(item) {
        var index = _items.indexOf(item);
        if (index !== -1) {
            _items.splice(index, 1);
            return true;
        }
        return false;
    };

    /** Returns first item or null for empty container.*/
    this.first = function() {
        if (_items.length > 0) {
            _iter = 1;
            return _items[0];
        }
        return null;
    };

    /** Returns next item from container or null if there are no more items.*/
    this.next = function() {
        if (_iter < _items.length) {
            return _items[_iter++];
        }
        return null;
    };

    /** Returns true for empty container.*/
    this.isEmpty = function() {
        return _items.length === 0;
    };

};
RG.extend2(RG.RogueItemContainer, RG.RogueItem);

/** Models one slot in the inventory. */
RG.RogueEquipSlot = function(eq, type, n) {
    RG.Ownable.call(this, eq);
    var _eq = eq;
    var _nitems = n;
    var _type = type;
    var _items = [];

    this.getItems = function() {
        return _items;
    };

    this.equipItem = function(item) {
        if (this.canEquip(item)) {
            item.setOwner(this);
            _items.push(item);
            return true;
        }
        return false;
    };

    this.unequipItem = function(n) {
        if (n < _items.length) {
            _items.splice(n, 1);
            return true;
        }
        return false;
    };

    this.canEquip = function(item) {
        return _items.length < _nitems;
    };

};
RG.extend2(RG.RogueEquipSlot, RG.Ownable);

/** Models equipment on an actor.*/
RG.RogueEquipment = function(actor) {
    RG.Ownable.call(this, actor);

    var _slots = {
        hand: new RG.RogueEquipSlot(this, "hand", 2),
        head: new RG.RogueEquipSlot(this, "head", 1),
        chest: new RG.RogueEquipSlot(this, "chest", 1),
        neck: new RG.RogueEquipSlot(this, "neck", 1),
        feet: new RG.RogueEquipSlot(this, "feet", 1),
    };

    this.equipItem = function(item) {
        // TODO add proper checks for equipping
        if (item.hasOwnProperty("equip")) {
            return _slots[item.equip].equipItem(item);
        }
        else {
            return _slots.hand.equipItem(item);
        }
    };

    this.getEquipped = function(slotType) {
        return _slots[slotType].getItems();
    };

    this.unequipItem = function(slotType, n) {
        return _slots[slotType].unequipItem(n);
    };

};
RG.extend2(RG.RogueEquipment, RG.Ownable);

/** Object models inventory items and equipment on actor. This object handles
 * movement of items between inventory and equipment. */
RG.RogueInvAndEquip = function(actor) {
    RG.Ownable.call(this, actor);
    var _actor = actor;

    var _inv = new RG.RogueItemContainer(actor);
    var _eq  = new RG.RogueEquipment(actor);

    // Wrappers for container methods
    this.addItem = function(item) {
        _inv.addItem(item);
    };

    this.getInventory = function() {return _inv;};
    this.getEquipment = function() {return _eq;};

    /** Removes item from inventory and equips it.*/
    this.equipItem = function(item) {
        if (_inv.hasItem(item)) {
            if (_eq.equipItem(item)) {
                return _inv.removeItem(item);
            }
        }
        else {
            RG.err("InvAndEquip", "equipItem", "Cannot equip. Not in inventory.");
        }
        return false;
    };

    /** Unequips item and puts it back to inventory.*/
    this.unequipItem = function(item) {
        if (_eq.isEquipped(item)) {
            if (_eq.unequipItem(item)) {
                this.addItem(item);
            }
        }
    };


};
RG.extend2(RG.RogueInvAndEquip, RG.Ownable);

/** Object representing a game actor who takes actions.  */
RG.RogueActor = function(isPlayer, name) { // {{{2
    RG.Locatable.call(this);
    RG.Combatant.call(this, RG.DEFAULT_HP);

    this.setType("actors");
    var _brain = null;
    var _isPlayer = isPlayer === undefined ? false : isPlayer;
    var _name = name;

    this.id = RG.IdCount++;

    if (!isPlayer) {
        _brain = new RG.RogueBrain(this);
        if (name === undefined) _name = "NPC";
    }
    else {
        _brain = new RG.PlayerBrain(this);
        if (name === undefined) _name = "Human";
    }

    /** Returns true if actor is a player.*/
    this.isPlayer = function() {
        return _isPlayer;
    };

    /** Returns the next action for this actor.*/
    this.nextAction = function(obj) {
        // Use actor brain to determine the action
        var cb = _brain.decideNextAction(obj);
        if (cb !== null) {
            return new RG.RogueAction(RG.ACTION_DUR, cb, {});
        }
        else {
            return new RG.RogueAction(0, function(){}, {});
        }
    };

    this.getFOVRange = function() {
        return RG.FOV_RANGE;
    };

    this.getName = function() {return _name;};
    this.setName = function(name) {_name = name;};

};
RG.extend2(RG.RogueActor, RG.Locatable);
RG.extend2(RG.RogueActor, RG.Combatant);
// }}} Actor

/** Element is a wall or other obstacle or a feature in the map. It's not
 * necessarily blocking movement.  */
RG.RogueElement = function(elemType) { // {{{2
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
// }}} Element

/** Models an action. Each action has a duration and a callback.  */
RG.RogueAction = function(dur, cb, obj) { // {{{2

    var _duration = dur;
    var _cb = cb; // Action callback

    this.getDuration = function() {
        return _duration;
    };

    this.doAction = function() {
        _cb(obj);
    };

}; // }}} Action

//---------------------------------------------------------------------------
// BRAINS {{{1
//---------------------------------------------------------------------------

/** This brain is used by the player actor. It simply handles the player input
 * but by having brain, player actor looks like other actors.  */
RG.PlayerBrain = function(actor) { // {{{2

    var _actor = actor;

    this.decideNextAction = function(obj) {
        var code = obj.code;
        var level = _actor.getLevel();

        // Need existing position
        var x = _actor.getX();
        var y = _actor.getY();
        var xOld = x;
        var yOld = y;

        console.log("PlayerBrain Pressed key code was " + code);

        var type = "MOVE";
        if (code === ROT.VK_D) ++x;
        if (code === ROT.VK_A) --x;
        if (code === ROT.VK_W) --y;
        if (code === ROT.VK_X) ++y;
        if (code === ROT.VK_Q) {--y; --x;}
        if (code === ROT.VK_E) {--y; ++x;}
        if (code === ROT.VK_C) {++y; ++x;}
        if (code === ROT.VK_Z) {++y; --x;}
        if (code === ROT.VK_S) {
            // IDLE action
            type = "IDLE";
        }

        if (code === ROT.VK_PERIOD) {
            type = "PICKUP";
            return function() {
                level.pickupItem(_actor, x, y);
            };
        }

        if (type === "MOVE") {
            if (level.getMap().isPassable(x, y)) {
                return function() {
                    level.moveActorTo(_actor, x, y);
                };
            }
            else if (level.getMap().getCell(x,y).hasProp("actors")) {
                return function() {
                    level.attackWith(_actor, x, y);
                };
            }
        }
        else if (type === "IDLE") {
            return function() {};
        }

        return null; // Null action
    };

}; // }}} PlayerBrain


/** Brain is used by the AI to perform and decide on actions. Brain returns
 * actionable callbacks but doesn't know Action objects.  */
RG.RogueBrain = function(actor) { // {{{2

    var _actor = actor;
    var _explored = {};

    var passableCallback = function(x, y) {
        var map = _actor.getLevel().getMap();
        if (!RG.isNullOrUndef([map])) {
            var res = map.isPassable(x, y);
            if (!res) {
                res = (x === _actor.getX()) && (y === _actor.getY());
            }
            return res;
        }
        else {
            RG.err("Brain", "passableCallback", "_map not well defined.");
        }
        return false;
    };

    /** Main function for retrieving the actionable callback. Acting actor must
     * be passed in. */
    this.decideNextAction = function(obj) {
        var level = _actor.getLevel();
        var seenCells = level.getMap().getVisibleCells(_actor);
        var playerCell = this.findPlayerCell(seenCells);

        if (!RG.isNullOrUndef([playerCell])) { // Move or attack
            var playX = playerCell.getX();
            var playY = playerCell.getY();
            if (this.canAttack(playX, playY)) {
                return function() {
                    level.attackWith(_actor, playX, playY);
                };
            }
            else { // Move closer
                var pathCells = this.getShortestPathTo(playerCell);
                var pathX = pathCells[1].getX();
                var pathY = pathCells[1].getY();
                return function() {
                    level.moveActorTo(_actor, pathX, pathY);
                };
            }
        }

        var index = -1;
        for (var i = 0; i < seenCells.length; i++) {
            if (seenCells[i].isFree()) {
                if (!_explored.hasOwnProperty(seenCells[i])) {
                    _explored[seenCells[i]] = true;
                    index = i;
                    break;
                }
            }
        }

        return function() {
            var x = seenCells[index].getX();
            var y = seenCells[index].getY();
            level.moveActorTo(_actor, x, y);
        };
    };

    this.canAttack = function(x, y) {
        var actorX = _actor.getX();
        var actorY = _actor.getY();
        var attackRange = _actor.getAttackRange();
        var getDist = RG.shortestDist(x, y, actorX, actorY);
        if (getDist <= attackRange) return true;
        return false;
    };

    /** Given a list of cells, returns a cell with player in it or null.*/
    this.findPlayerCell = function(cells) {
        for (var i = 0; i < cells.length; i++) {
            if (cells[i].hasProp("actors")) {
                var actors = cells[i].getProp("actors");
                if (actors[0].isPlayer()) return cells[i];
            }
        }
        return null;
    };

    /** Returns shortest path from actor to the given cell. Resulting cells are
     * returned in order: closest to the actor first. Thus moving to next cell
     * can be done by taking the first returned cell.*/
    this.getShortestPathTo = function(cell) {
        var path = [];
        var toX = cell.getX();
        var toY = cell.getY();
        var pathFinder = new ROT.Path.Dijkstra(toX, toY, passableCallback);
        var map = _actor.getLevel().getMap();
        var sourceX = _actor.getX();
        var sourceY = _actor.getY();

        if (RG.isNullOrUndef([toX, toY, sourceX, sourceY])) {
            RG.err("Brain", "getShortestPathTo", "Null/undef coords.");
        }

        pathFinder.compute(sourceX, sourceY, function(x, y) {
            if (map.hasXY(x, y)) {
                path.push(map.getCell(x, y));
            }
        });
        return path;
    };

}; // }}} RogueBrain

RG.ZombieBrain = function() {
    RG.RogueBrain.call(this);

};
RG.extend2(RG.ZombieBrain, RG.RogueBrain);


// }}} BRAINS

/** Scheduler for the game actions.  */
RG.RogueScheduler = function() { // {{{2

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

    /** Hooks to the event system. When actor is killed, removes it from the
     * pool.*/
    this.notify = function(evtName, args) {
        if (evtName === RG.EVT_ACTOR_KILLED) {
            if (args.hasOwnProperty("actor")) {
                this.remove(args.actor);
            }
        }
    };
    RG.POOL.listenEvent(RG.EVT_ACTOR_KILLED, this);


}; // }}} Scheduler


//---------------------------------------------------------------------------
// MAP GENERATION SECTION {{{1
//---------------------------------------------------------------------------

/** Map generator for the roguelike game.  */
RG.RogueMapGen = function() { // {{{2

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

}; // }}} RogueMapGen

/** Object representing one game cell. It can hold actors, items, traps or
 * elements. */
RG.MapCell = function(x, y, elem) { // {{{2 

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
                    return true;
                }
            }
        }
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

    this.isPassable = function() {
        return this.isFree();
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

}; // }}} MapCell

/** Map object which contains a number of cells. A map is used for rendering
 * while the level contains actual information about game elements such as
 * monsters and items.  */
RG.Map = function(cols, rows) { //{{{2
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

    /** Returns true if the map has a cell in given x,y location.*/
    var _hasXY = function(x, y) {
        return (x >= 0) && (x < _cols) && (y >= 0) && (y < _rows);
    };

    /** Returns true if light passes through this cell.*/
    var lightPasses = function(x, y) {
        if (_hasXY(x, y)) {
            return map[x][y].lightPasses(); // delegate to cell
        }
        return false;
    };

    this.isPassable = function(x, y) {
        if (_hasXY(x, y)) {
            return map[x][y].isPassable();
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

}; // }}} Map

// }}} MAP GENERATION

if ( typeof exports !== 'undefined' ) {
    if( typeof RG !== 'undefined' && module.exports ) {
        exports = module.exports = RG;
    }
    exports.RG = RG;
}
else {
    window.RG = RG;
}
