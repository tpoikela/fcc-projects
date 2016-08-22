/*
 * Contains the main object "RoguelikeGame", the top-level game object.
 */

function getSource(key, fname) {
    var has_require = typeof require !== 'undefined';

    if (typeof window !== 'undefined') {
        var src = window[key];
    }

    if (typeof src === 'undefined' ) {
        if (has_require) {
          src = require(fname);
        }
        else throw new Error('Module ' + key + ' not found');
    }

    return src;
};

var ROT = getSource("ROT", "./rot.js");
var RG  = getSource("RG", "./src/rg.js");

/** Object for the game levels. Contains map, actors and items.  */
RG.RogueLevel = function(cols, rows) { // {{{2
    var _map = null;

    // Level properties
    var _p = {
        actors: [],
        items:  [],
        elements: [],
        stairs: [],
    };

    var _id = RG.RogueLevel.prototype.idCount++;
    console.log("Created level with ID " + _id);

    this.getID = function() {return _id;};

    this.getActors = function() {
        return _p.actors;
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

    /** Given a level, returns stairs which lead to that level.*/
    this.getStairs = function(level) {
        for (var i = 0; i < _p.stairs.length; i++) {
            if (_p.stairs[i].getTargetLevel() === level) {
                return _p.stairs[i];
            }
        }
    };

    //---------------------------------------------------------------------
    // STAIRS RELATED FUNCTIONS
    //---------------------------------------------------------------------

    /** Adds stairs for this level.*/
    this.addStairs = function(stairs, x, y) {
        stairs.setX(x);
        stairs.setY(y);
        if (stairs.getSrcLevel() !== this) stairs.setSrcLevel(this);
        _map.setProp(x, y, "elements", stairs);
        _p.elements.push(stairs);
        _p.stairs.push(stairs);
    };

    /** Uses stairs for given actor if it's on top of the stairs.*/
    this.useStairs = function(actor) {
        var cell = _map.getCell(actor.getX(), actor.getY());
        if (cell.hasStairs()) {
            var stairs = cell.getStairs();
            if (stairs.useStairs(actor)) {
                return true;
            }
            else {
                RG.err("Level", "useStairs", "Failed to use the stairs.");
            }
        }
        return false;
    };

    //---------------------------------------------------------------------
    // ITEM RELATED FUNCTIONS
    //---------------------------------------------------------------------

    this.addItem = function(item, x, y) {
        if (!RG.isNullOrUndef([x, y])) {
            return this._addPropToLevelXY(RG.TYPE_ITEM, item, x, y);
        }
        else {
            var freeCells = _map.getFree();
            if (freeCells.length > 0) {
                var xCell = freeCells[0].getX();
                var yCell = freeCells[0].getY();
                return this._addPropToLevelXY(RG.TYPE_ITEM, item, xCell, yCell);
            }

        }
        return false;
    };

    this.removeItem = function(item, x, y) {
        return _map.removeProp(x, y, RG.TYPE_ITEM, item);
    };

    this.pickupItem = function(actor, x, y) {
        var cell = _map.getCell(x, y);
        if (cell.hasProp(RG.TYPE_ITEM)) {
            var item = cell.getProp(RG.TYPE_ITEM)[0];
            actor.getInvEq().addItem(item);
            cell.removeProp(RG.TYPE_ITEM, item);
            RG.gameMsg(actor.getName() + " picked up " + item.getName());
        }
        else {
            RG.gameMsg("Nothing to pickup");
        }
    };

    //---------------------------------------------------------------------
    // ACTOR RELATED FUNCTIONS
    //---------------------------------------------------------------------

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

    /** Adds a prop to level to location x,y. Returns true on success, false on
     * failure.*/
    this._addPropToLevelXY = function(propType, obj, x, y) {
        if (_p.hasOwnProperty(propType)) {
            _p[propType].push(obj);
            if (obj.hasOwnProperty("setXY")) {
                obj.setXY(x,y);
                obj.setLevel(this);
            }
            _map.setProp(x, y, propType, obj);
            RG.POOL.emitEvent(RG.EVT_LEVEL_PROP_ADDED, {level: this, obj: obj,
                propType: propType});
            return true;
        }
        else {
            RG.err("Level", "_addPropToLevelXY", "No property " + propType);
        }
        return false;
    };

    /** Removes given actor from level. Returns true if successful.*/
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
RG.RogueLevel.prototype.idCount = 0;

RG.DefenseObject = function() {

    var _attack   = 1;
    var _defense  = 1;
    var _protection = 0;

    this.getAttack = function() {return _attack;};
    this.setAttack = function(attack) { _attack = attack; };

    /** Defense related methods.*/
    this.getDefense = function() { return _defense; };
    this.setDefense = function(defense) { _defense = defense; };

    this.getProtection = function() {return _protection;};
    this.setProtection = function(prot) {return _protection;};

};

RG.DamageObject = function() {
    RG.DefenseObject.call(this);

    var _damage   = new RG.Die(1, 4, 0);
    var _range    = 1;

    /** Attack methods. */
    this.setAttackRange = function(range) {_range = range;};
    this.getAttackRange = function() {return _range; };

    this.setDamage = function(dStr) {
        _damage = RG.FACT.createDie(dStr);
    };

    this.getDamage = function() {
        if (this.hasOwnProperty("getWeapon")) {
            var weapon = this.getWeapon();
            if (!RG.isNullOrUndef([weapon])) {
                return weapon.getDamage();
            }
        }
        return _damage.roll();
    };

    this.getDamageDie = function() {
        return _damage;
    };

};

RG.DamageObject.prototype.toString = function() {
    var msg = " A: " + this.getAttack() + ", D: " + this.getDefense() + ", ";
    msg += "Dmg: " + this.getDamageDie().toString();
    msg += ",R:" + this.getAttackRange();
    return msg;
};
RG.extend2(RG.DamageObject, RG.DefenseObject);

//---------------------------------------------------------------------------
// ECS ENTITY
//---------------------------------------------------------------------------

RG.Entity = function() {

    var _id = RG.Entity.prototype.idCount++;

    var _comps = {};

    this.getID = function() {return _id;};

    this.get = function(name) {
        if (_comps.hasOwnProperty(name)) return _comps[name];
        return null;
    };

    this.add = function(name, comp) {
        _comps[name] = comp;
        comp.addCallback(this);
        RG.POOL.emitEvent(name, {entity: this, add: true});
    };

    this.has = function(name) {
        return _comps.hasOwnProperty(name);
    };

    this.remove = function(name) {
        if (_comps.hasOwnProperty(name)) {
            var comp = _comps[name];
            comp.removeCallback(this);
            delete _comps[name];
            RG.POOL.emitEvent(name, {entity: this, remove: true});
        }
    };

};
RG.Entity.prototype.idCount = 0;

//---------------------------------------------------------------------------
// ECS COMPONENTS
//---------------------------------------------------------------------------

RG.Component = function(type) {

    var _type = type;
    var _entity = null;
    this.getType = function() {return _type;};

    this.getEntity = function() {return _entity;};
    this.setEntity = function(entity) {
        if (_entity === null && entity !== null) {
            _entity = entity;
        }
        else if (entity === null) {
            _entity = null;
        }
        else {
            RG.err("Component", "setEntity", "Entity already set.");
        }
    };

};
// Called when a component is added to the entity
RG.Component.prototype.addCallback = function(entity) {
    this.setEntity(entity);
    RG.POOL.emitEvent(this.getType(), {add:true, entity: entity});
};

// Called when a component is removed from the entity
RG.Component.prototype.removeCallback = function(entity) {
    this.setEntity(null);
    RG.POOL.emitEvent(this.getType(), {remove:true, entity: entity});
};

/** Action component is added to all schedulable acting entities.*/
RG.ActionComponent = function() {
    RG.Component.call(this, "Action");

    var _energy = 0;
    var _active = false;
    this.getEnergy = function() {return _energy;};

    this.addEnergy = function(energy) {
        _energy += energy;
    };

    this.resetEnergy = function() {_energy = 0;};

    this.enable = function() {
        if (_active === false) {
            RG.POOL.emitEvent(RG.EVT_ACT_COMP_ENABLED, 
                {actor: this.getEntity()});
            _active = true;
        }
    };

    this.disable = function() {
        if (_active === true) {
            RG.POOL.emitEvent(RG.EVT_ACT_COMP_DISABLED, 
                {actor: this.getEntity()});
            _active = false;
        }
    };

};
RG.extend2(RG.ActionComponent, RG.Component);

RG.ActionComponent.prototype.addCallback = function(entity) {
    RG.Component.prototype.addCallback.call(this, entity);
    //RG.POOL.emitEvent(RG.EVT_ACT_COMP_ADDED, {actor: entity});
};

RG.ActionComponent.prototype.removeCallback = function(entity) {
    RG.Component.prototype.removeCallback.call(this, entity);
    //RG.POOL.emitEvent(RG.EVT_ACT_COMP_REMOVED, {actor: entity});
};

/** Component which takes care of hunger and satiation. */
RG.HungerComponent = function(energy) {
    RG.Component.call(this, "Hunger");

    var _currEnergy = 2000;
    var _maxEnergy = 2000;

    this.getEnergy = function() {return _currEnergy;};
    this.getMaxEnergy = function() {return _maxEnergy;};

    this.setEnergy = function(energy) {_currEnergy = energy;};
    this.setMaxEnergy = function(energy) {_maxEnergy = energy;};

    if (!RG.isNullOrUndef([energy])) {
        _currEnergy = energy;
        _maxEnergy = energy;
    }

    this.addEnergy = function(energy) {
        _currEnergy += energy;
        if (_currEnergy > _maxEnergy) _currEnergy = _maxEnergy;
    };

    this.decrEnergy = function(energy) {
        _currEnergy -= energy;
    };

    this.isStarving = function() {
        return _currEnergy < 100;
    };

    this.isFull = function() {return _currEnergy === _maxEnergy;};

};
RG.extend2(RG.HungerComponent, RG.Component);

/** Health component takes care of HP and such. */
RG.HealthComponent = function(hp) {
    RG.Component.call(this, "Health");

    var _hp = hp;
    var _maxHP = hp;

    /** Hit points getters and setters.*/
    this.getHP = function() {return _hp;};
    this.setHP = function(hp) {_hp = hp;};
    this.getMaxHP = function() {return _maxHP;};
    this.setMaxHP = function(hp) {_maxHP = hp;};

    this.addHP = function(hp) {
        _hp += hp;
        if (_hp > _maxHP) _hp = _maxHP;
    };

    this.decrHP = function(hp) {_hp -= hp;};

    this.isAlive = function() {return _hp > 0;};
    this.isDead = function() {return _hp <= 0;};

};
RG.extend2(RG.HealthComponent, RG.Component);

/** Component which is used to deal damage.*/
RG.DamageComponent = function(dmg, type) {
    RG.Component.call(this, "Damage");

    var _dmg = dmg;
    var _type = type;
    var _src = null;

    this.getDamage = function() {return _dmg;};
    this.setDamage = function(dmg) {_dmg = dmg;};

    this.getDamageType = function() {return _type;};
    this.setDamageType = function(type) {_type = type;};

    this.getSource = function() {return _src;};
    this.setSource = function(src) {_src = src;};

};
RG.extend2(RG.DamageComponent, RG.Component);

/** Component used in entities gaining experience.*/
RG.ExperienceComponent = function() {
    RG.Component.call(this, "Experience");

    var _exp      = 0;
    var _expLevel = 1;

    var _danger = 1;

    /** Experience-level methods.*/
    this.setExp = function(exp) {_exp = exp;};
    this.getExp = function() {return _exp;};
    this.addExp = function(nExp) {_exp += nExp;};
    this.setExpLevel = function(expLevel) {_expLevel = expLevel;};
    this.getExpLevel = function() {return _expLevel;};

    this.setDanger = function(danger) {_danger = danger;};
    this.getDanger = function() {return _danger;};

};
RG.extend2(RG.ExperienceComponent, RG.Component);

/** This component is added when entity gains experience.*/
RG.ExpPointsComponent = function(expPoints) {
    RG.Component.call(this, "ExpPoints");

    var _expPoints = expPoints;
    var _skills = {};

    this.setSkillPoints = function(skill, pts) {
        _skills[skill] = pts;
    };
    this.getSkillPoints = function() {return _skills;};

    this.setExpPoints = function(exp) {_expPoints = exp;};
    this.getExpPoints = function() {return _expPoints;};
    this.addExpPoints = function(exp) { _expPoints += exp;};

};
RG.extend2(RG.ExpPointsComponent, RG.Component);

/** This component is added when entity gains experience.*/
RG.CombatComponent = function() {
    RG.Component.call(this, "Combat");

    var _attack   = 1;
    var _defense  = 1;
    var _protection = 0;
    var _damage = RG.FACT.createDie("1d4");
    var _range    = 1;

    this.getAttack = function() {return _attack;};
    this.setAttack = function(attack) { _attack = attack; };

    /** Defense related methods.*/
    this.getDefense = function() { return _defense; };
    this.setDefense = function(defense) { _defense = defense; };

    this.getProtection = function() {return _protection;};
    this.setProtection = function(prot) {_protection = prot;};

    this.getDamage = function() {
        // TODO add weapon effects
        if (this.getEntity().hasOwnProperty("getWeapon")) {
            var weapon = this.getEntity().getWeapon();
            if (weapon !== null)
                return weapon.getDamage();
        }
        return _damage.roll();
    };

    this.setDamage = function(strOrArray) {
        _damage = RG.FACT.createDie(strOrArray);
    };

    /** Attack methods. */
    this.setAttackRange = function() {_range = range;};
    this.getAttackRange = function() {return _range; };

};
RG.extend2(RG.CombatComponent, RG.Component);

/** This component stores entity stats like speed, agility etc.*/
RG.StatsComponent = function() {
    RG.Component.call(this, "Stats");

    var _accuracy = 5;
    var _agility  = 5;
    var _willpower = 5;

    var _speed = 100;

    /** These determine the chance of hitting. */
    this.setAccuracy = function(accu) {_accuracy = accu;};
    this.getAccuracy = function() {return _accuracy;};
    this.setAgility = function(agil) {_agility = agil;};
    this.getAgility = function() {return _agility;};
    this.setWillpower = function(_wp) {_willpower = wp;};
    this.getWillpower = function() {return _willpower;};

    this.setSpeed = function(speed) {_speed = speed;};
    this.getSpeed = function() {return _speed;};

};
RG.extend2(RG.StatsComponent, RG.Component);


/** Attack component is added to the actor when it attacks.*/
RG.AttackComponent = function(target) {
    RG.Component.call(this, "Attack");

    var _target = target;

    this.setTarget = function(t) {_target = t;};
    this.getTarget = function() {return _target;};

};
RG.extend2(RG.AttackComponent, RG.Component);

/** Transient component added to a moving entity.*/
RG.MovementComponent = function(x, y, level) {
    RG.Locatable.call(this);
    RG.Component.call(this, "Movement");

    this.setXY(x, y);
    this.setLevel(level);

};
RG.extend2(RG.MovementComponent, RG.Locatable);
RG.extend2(RG.MovementComponent, RG.Component);

/** Added to entities which must act as missiles flying through cells.*/
RG.MissileComponent = function(source) {
    RG.Component.call(this, "Missile");

    var _x = source.getX();
    var _y = source.getY();
    var _source = source;
    var _level = source.getLevel();
    var _isFlying = true;

    var _targetX = null;
    var _targetY = null;

    var _range = 0;
    var _attack = 0;
    var _dmg = 0;

    var _path = []; // Flying path for the missile
    var _path_iter = -1;

    this.getX = function() {return _x;};
    this.getY = function() {return _y;};
    this.getSource = function() {return _source;};
    this.getLevel = function() {return _level;};

    this.setRange = function(range) {_range = range;};
    this.hasRange = function() {return _range > 0;};
    this.isFlying = function() {return _isFlying;};
    this.stopMissile = function() {_isFlying = false;};

    this.getAttack = function() {return _attack;};
    this.setAttack = function(att) {_attack = att;};
    this.getDamage = function() {return _dmg;};
    this.setDamage = function(dmg) {_dmg = dmg;};

    this.setTargetXY = function(x, y) {
        _path = RG.getShortestPath(_x, _y, x, y);
        _targetX = x;
        _targetY = y;
        if (_path.length > 0) _path_iter = 0;
    };

    this.getTargetX = function() {return _targetX;};
    this.getTargetY = function() {return _targetY;};

    /** Returns true if missile has reached its target map cell.*/
    this.inTarget = function() {
        return _x === _targetX && _y === _targetY;
    };

    var iteratorValid = function() {
        return _path_iter >= 0 && _path_iter < _path.length;
    };

    var setValuesFromIterator = function() {
        var coord = _path[_path_iter];
        _x = coord.x;
        _y = coord.y;
    };

    this.first = function() {
        if (iteratorValid()) {
            _path_iter = 0;
            setValuesFromIterator();
        }
        return null;
    };

    /** Returns the next cell in missile's path. Moves iterator forward. */
    this.next = function() {
        if (iteratorValid()) {
            --_range;
            ++_path_iter;
            setValuesFromIterator();
            return true;
        }
        return null;
    };

    /** Returns the prev cell in missile's path. Moves iterator backward. */
    this.prev = function() {
        if (iteratorValid()) {
            ++_range;
            --_path_iter;
            setValuesFromIterator();
            return true;
        }
        return null;
    };

};
RG.extend2(RG.MissileComponent, RG.Component);

/** This component holds loot that is dropped when given entity is destroyed.*/
RG.LootComponent = function(lootEntity) {
    RG.Component.call(this, "Loot");

    var _lootEntity = lootEntity;

    /** Drops the loot to the given cell.*/
    this.dropLoot = function(cell) {
        if (_lootEntity.hasOwnProperty("getPropType")) {
            var propType = _lootEntity.getPropType();
            if (propType === "elements") {
                this.setElemToCell(cell);
            }
            else {
                cell.setProp(propType, _lootEntity);
            }
        }
        else {
            RG.err("LootComponent", "dropLoot", "Loot has no propType!");
        }
    };

    this.setElemToCell = function(cell) {
        var entLevel = this.getEntity().getLevel();
        if (_lootEntity.hasOwnProperty("useStairs")) {
            console.log("Added stairs to " + cell.getX() + ", " + cell.getY());
            entLevel.addStairs(_lootEntity, cell.getX(), cell.getY());
        }
    };

};
RG.extend2(RG.LootComponent, RG.Component);

/** This component is added to entities receiving communication. Communication
 * is used to point out enemies and locations of items, for example.*/
RG.CommunicationComponent = function() {
    RG.Component.call(this, "Communication");

    var _messages = [];

    this.getMsg = function() {return _messages;};

    this.addMsg = function(obj) {
        _messages.push(obj);
    };

};
RG.extend2(RG.CommunicationComponent, RG.Component);

//---------------------------------------------------------------------------
// ECS SYSTEMS {{{1
//---------------------------------------------------------------------------

/** Base class for all systems in ECS framework.*/
RG.System = function(type, compTypes) {

    this.type = type;
    this.compTypes = compTypes; // Required comps in entity
    this.entities = {};

    this.addEntity = function(entity) {
        this.entities[entity.getID()] = entity;
    };

    this.removeEntity = function(entity) {
        delete this.entities[entity.getID()];
    };

    this.notify = function(evtName, obj) {
        if (obj.hasOwnProperty("add")) {
            if (this.hasCompTypes(obj.entity))
                this.addEntity(obj.entity);
        }
        else if (obj.hasOwnProperty("remove")) {
            this.removeEntity(obj.entity);
        }
    };

    this.validateNotify = function(obj) {
        if (obj.hasOwnProperty("remove")) return true;
        if (obj.hasOwnProperty("add")) return true;
        return false;
    };

    /** Returns true if entity has all required component types.*/
    this.hasCompTypes = function(entity) {
        for (var i = 0; i < compTypes.length; i++) {
            if (! entity.has(compTypes[i])) return false;
        }
        return true;
    };

    for (var i = 0; i < this.compTypes.length; i++) {
        RG.POOL.listenEvent(this.compTypes[i], this);
    }

};


/** Processes entities with attack-related components.*/
RG.AttackSystem = function(type, compTypes) {
    RG.System.call(this, type, compTypes);

    this.update = function() {
        for (var e in this.entities) {
            var ent = this.entities[e];

            var _att = ent;
            var _def = ent.get("Attack").getTarget();

            var attEquip  = _att.getEquipAttack();
            var defEquip  = _def.getEquipDefense();
            var attWeapon = _att.getWeapon();

            var attComp = _att.get("Combat");
            var defComp = _def.get("Combat");

            var attackPoints = attComp.getAttack();
            var defPoints    = defComp.getDefense();
            var damage       = attComp.getDamage();

            var accuracy = _att.get("Stats").getAccuracy();
            var agility = _def.get("Stats").getAgility();

            // Actual hit change calculation
            var totalAttack = attackPoints + accuracy/2 + attEquip;
            var totalDefense = defPoints + agility/2 + defEquip;
            var hitChange = totalAttack / (totalAttack + totalDefense);

            //RG.gameMsg(_att.getName() + " attacks " + _def.getName());
            if (hitChange > Math.random()) {
                var totalDamage = damage;
                if (totalDamage > 0)
                    this.doDamage(_att, _def, damage);
                else
                    RG.gameMsg(_att.getName() + " fails to hurt " + _def.getName());
            }
            else {
                RG.gameMsg(_att.getName() + " misses " + _def.getName());
            }
            _def.addEnemy(_att);
            ent.remove("Attack");
        }
    }

    this.doDamage = function(att, def, dmg) {
        var dmgComp = new RG.DamageComponent(dmg, "cut");
        dmgComp.setSource(att);
        def.add("Damage", dmgComp);
        RG.gameMsg(att.getName() + " hits " + def.getName());
    };
};
RG.extend2(RG.AttackSystem, RG.System);

// Missile has
// srcX/Y, targetX/X, path, currX/Y, shooter + all damage components, item ref
// SourceComponent, TargetComponent, LocationComponent, OwnerComponent

/** Processes all missiles launched by actors/traps/etc.*/
RG.MissileSystem = function(type, compTypes) {
    RG.System.call(this, type, compTypes);

    this.update = function() {
        for (var e in this.entities) {

            var ent   = this.entities[e];
            var mComp = ent.get("Missile");
            var level = mComp.getLevel();
            var map   = level.getMap();
            var mSrc = mComp.getSource();
            //mSrc.getInvEq().unequipAndGetItem("missile", 0);

            while (mComp.isFlying() && !mComp.inTarget() && mComp.hasRange()) {

                // Advance missile to next cell
                mComp.next();
                var currX = mComp.getX();
                var currY = mComp.getY();
                var currCell = map.getCell(currX, currY);

                // Wall was hit, stop missile
                if (currCell.hasPropType("wall")) {
                    mComp.prev();
                    var prevX = mComp.getX();
                    var prevY = mComp.getY();
                    var prevCell = map.getCell(prevX, prevY);

                    this.finishMissileFlight(ent, mComp, prevCell);
                    console.log("Stopped missile to wall");
                }
                else if (currCell.hasProp("actors")) {
                    var actor = currCell.getProp("actors")[0];
                    // Check hit and miss
                    if (this.targetHit(actor, mComp)) {
                        this.finishMissileFlight(ent, mComp, currCell);
                        var dmg = mComp.getDamage();
                        var damageComp = new RG.DamageComponent(dmg, "thrust");
                        damageComp.setSource(mComp.getSource());
                        damageComp.setDamage(mComp.getDamage());
                        actor.add("Damage", damageComp);
                        console.log("Hit an actor");
                    }
                    else if (mComp.inTarget()) {
                        this.finishMissileFlight(ent, mComp, currCell);
                        console.log("In target cell, and missed an entity");
                    }
                    else if (!mComp.hasRange()) {
                        this.finishMissileFlight(ent, mComp, currCell);
                        console.log("Missile out of range. Missed entity.");
                    }
                }
                else if (mComp.inTarget()) {
                    this.finishMissileFlight(ent, mComp, currCell);
                    console.log("In target cell but no hits");
                }
                else if (!mComp.hasRange()) {
                    this.finishMissileFlight(ent, mComp, currCell);
                    console.log("Missile out of range. Hit nothing.");
                }
            }

        }
    };

    this.finishMissileFlight = function(ent, mComp, currCell) {
        mComp.stopMissile(); // Target reached, stop missile
        ent.remove("Missile");
        var level = mComp.getLevel();
        //currCell.setProp(ent.getPropType(), ent);
        level.addItem(ent, currCell.getX(), currCell.getY());
    };

    /** Returns true if the target was hit.*/
    this.targetHit = function(target, mComp) {
        var attack = mComp.getAttack();
        var defense = target.get("Combat").getDefense();
        var hitProp = attack / (attack + defense);
        var hitRand = Math.random();
        if (hitProp > hitRand) return true;
        return false;
    };

    this.getDamage = function(target, mComp) {

    };

};
RG.extend2(RG.MissileSystem, RG.System);

/** Processes entities with damage component.*/
RG.DamageSystem = function(type, compTypes) {
    RG.System.call(this, type, compTypes);

    this.update = function() {
        for (var e in this.entities) {
            var ent = this.entities[e];
            if (ent.has("Health")) { // Redundant ??
                var health = ent.get("Health");
                var dmg = ent.get("Damage").getDamage();

                // Take defs protection value into account
                var protEquip = ent.getEquipProtection();
                var protStats = ent.get("Combat").getProtection();
                var protTotal = protEquip + protStats;
                var totalDmg = dmg - protTotal;

                if (totalDmg <= 0) {
                    totalDmg = 0;
                    RG.gameMsg("Attack doesn't penetrate protection of " + ent.getName()); 
                }
                health.decrHP(totalDmg);

                if (health.isDead()) {
                    if (ent.has("Loot")) {
                        var entX = ent.getX();
                        var entY = ent.getY();
                        var entCell = ent.getLevel().getMap().getCell(entX, entY);
                        ent.get("Loot").dropLoot(entCell);
                    }

                    var src = ent.get("Damage").getSource();
                    this.killActor(src, ent);
                }
                ent.remove("Damage"); // After dealing damage, remove comp
            }
        }
    };

    this.killActor = function(src, actor) {
        var level = actor.getLevel();
        if (level.removeActor(actor)) {
            if (actor.has("Experience")) {
                this.giveExpToSource(src, actor);
            }
            RG.gameMsg(actor.getName() + " was killed");
            RG.POOL.emitEvent(RG.EVT_ACTOR_KILLED, {actor: actor});
        }
        else {
            RG.err("Combat", "killActor", "Couldn't kill actor");
        }
    };

    /** When an actor is killed, gives experience to damage's source.*/
    this.giveExpToSource = function(att, def) {
        var defLevel = def.get("Experience").getExpLevel();
        var defDanger = def.get("Experience").getDanger();
        var expPoints = new RG.ExpPointsComponent(defLevel + defDanger);
        att.add("ExpPoints", expPoints);
    };

};
RG.extend2(RG.DamageSystem, RG.System);

/** Called for entities which gained experience points recently.*/
RG.ExpPointsSystem = function(type, compTypes) {
    RG.System.call(this, type, compTypes);

    this.update = function() {
        for (var e in this.entities) {
            var ent = this.entities[e];

            var expComp = ent.get("Experience");
            var expPoints = ent.get("ExpPoints");

            var expLevel = expComp.getExpLevel();
            var exp = expComp.getExp();
            exp += expPoints.getExpPoints();
            expComp.setExp(exp);
            var nextLevel = expLevel + 1;
            var reqExp = 0;
            for (var i = 1; i <= nextLevel; i++) {
                reqExp += i * 10;
            }

            if (exp >= reqExp) { // Required exp points exceeded

                expComp.setExpLevel(nextLevel);

                // Increase max HP
                if (ent.has("Health")) {
                    var hComp = ent.get("Health");
                    hComp.setMaxHP(hComp.getMaxHP() + 5);
                    hComp.setHP(hComp.getHP() + 5);
                }

                if (ent.has("Combat")) {
                    var combatComp = ent.get("Combat");
                    combatComp.setAttack(combatComp.getAttack() + 1);
                    combatComp.setDefense(combatComp.getDefense() + 1);
                    if (nextLevel % 3 === 0) {
                        var prot = combatComp.getProtection();
                        combatComp.setProtection(prot + 1);
                    }
                    // TODO add something to damage roll
                }
                RG.gameMsg(ent.getName() + " advanced to level " + nextLevel);
            }
            ent.remove("ExpPoints");
        }
    };

};

RG.extend2(RG.ExpPointsSystem, RG.System);

/** This system handles all entity movement.*/
RG.MovementSystem = function(type, compTypes) {
    RG.System.call(this, type, compTypes);

    this.update = function() {
        for (var e in this.entities) {
            var ent = this.entities[e];
            this.moveEntity(ent);
        }
    };

    this.moveEntity = function(actor) {
        var x = actor.get("Movement").getX();
        var y = actor.get("Movement").getY();
        var level = actor.get("Movement").getLevel();
        var map = level.getMap();
        var cell = map.getCell(x, y);

        if (cell.isFree()) {
            var xOld = actor.getX();
            var yOld = actor.getY();
            RG.debug(this, "Trying to move actor from " + xOld + ", " + yOld);

            if (map.removeProp(xOld, yOld, "actors", actor)) {
                map.setProp(x, y, "actors", actor);
                actor.setXY(x, y);
                if (actor.isPlayer()) this.checkMessageEmits(cell);
                actor.remove("Movement");
                return true;
            }
            else {
                RG.err("MovementSystem", "moveActorTo", "Couldn't remove actor.");
            }
        }
        else {
            RG.debug(this, "Cell wasn't free at " + x + ", " + y);
        }
        actor.remove("Movement");
        return false;
    };

    // If player moved to the square, checks if any messages must be emitted.
    this.checkMessageEmits = function(cell) {
        if (cell.hasStairs()) RG.gameMsg("You see stairs here");
        if (cell.hasProp("items")) {
            var items = cell.getProp("items");
            if (items.length > 1) RG.gameMsg("There are several items here");
            else RG.gameMsg(items[0].getName() + " is on the floor");
        }
    };

};
RG.extend2(RG.MovementSystem, RG.System);

/** Processes entities with hunger component.*/
RG.HungerSystem = function(type, compTypes) {
    RG.System.call(this, type, compTypes);

    this.update = function() {
        for (var e in this.entities) {
            var ent = this.entities[e];
            var hungerComp = ent.get("Hunger");
            var actionComp = ent.get("Action");
            hungerComp.decrEnergy(actionComp.getEnergy());
            actionComp.resetEnergy();
            if (hungerComp.isStarving()) {
                if (ent.has("Health")) ent.get("Health").decrHP(1);

            }
        }
    };

};
RG.extend2(RG.HungerSystem, RG.System);

/** Processes entities with hunger component.*/
RG.CommunicationSystem = function(type, compTypes) {
    RG.System.call(this, type, compTypes);

    // Each entity here has received communication and must capture its
    // information contents
    this.update = function() {
        for (var e in this.entities) {
            var ent = this.entities[e];
            var comComp = ent.get("Communication");
            var messages = comComp.getMsg();
            for (var i = 0; i < messages.length; i++) {
                this.processMessage(ent, messages[i]);
            }
            ent.remove("Communication");
        }
    };

    this.processMessage = function(ent, msg) {
        if (_msgFunc.hasOwnProperty(msg.type)) {
            _msgFunc[msg.type](ent, msg);
        }
        else {
            RG.err("CommunicationSystem", "processMessage",
                "No function for msg type |" + msg.type + "| in dtable.");
        }
    };

    this.processEnemies = function(ent, msg) {
        var enemies = msg.enemies;
        for (var i = 0; i < enemies.length; i++) {
            ent.addEnemy(enemies[i]);
        }
    };

    // Dispatch table for different messages
    var _msgFunc = {
        Enemies: this.processEnemies,
    };

}
RG.extend2(RG.CommunicationSystem, RG.System);
// }}} SYSTEMS

//---------------------------------------------------------------------------
// ITEMS
//---------------------------------------------------------------------------

/** Models an item. Each item is ownable by someone. During game, there are no
 * items with null owners. Ownership shouldn't be ever set to null. */
RG.RogueItem = function(name) {
    RG.Ownable.call(this, null);
    this.setPropType(RG.TYPE_ITEM);

    var _name = name;
    var _weight = 1;
    var _value = 1;
    var _p = {}; // Stores all extra properties

    this.setName = function(name) {_name = name;};
    this.getName = function() {return _name;};

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
    this.getWeight = function() {return _weight;};
    this.setValue = function(value) {_value = value;};
    this.getValue = function() {return _value;};


};
RG.RogueItem.prototype.toString = function() {
    var txt = this.getName() + ", " + this.getType() + ", ";
    txt += this.getWeight() + "kg";
    return txt;
};
RG.extend2(RG.RogueItem, RG.Ownable);

/** Object representing food items in the game.*/
RG.RogueItemFood = function(name) {
    RG.RogueItem.call(this, name);
    this.setType("food");

    var _energy = 0;

    this.setEnergy = function(energy) {_energy = energy;};
    this.getEnergy = function() {return _energy;};

    /** Uses (eats) the food item.*/
    this.useItem = function(obj) {
        if (obj.hasOwnProperty("target")) {
            var target = obj.target;
            if (target.has("Hunger")) {
                target.get("Hunger").addEnergy(_energy);
                var msg = {item: this};
                RG.POOL.emitEvent(RG.EVT_DESTROY_ITEM, msg);
            }
        }
        else {
            RG.err("ItemFood", "useItem", "No target given in obj.");
        }
    };

};
RG.extend2(RG.RogueItemFood, RG.RogueItem);

/** Corpse object dropped by killed actors.*/
RG.RogueItemCorpse = function(name) {
    RG.RogueItem.call(this, name);
    this.setType("corpse");
};
RG.extend2(RG.RogueItemCorpse, RG.RogueItem);

/** Base object for all weapons.*/
RG.RogueItemWeapon = function(name) {
    RG.RogueItem.call(this, name);
    RG.DamageObject.call(this);
    this.setType("weapon");
};

RG.RogueItemWeapon.prototype.toString = function() {
    var msg = RG.RogueItem.prototype.toString.call(this);
    msg += RG.DamageObject.prototype.toString.call(this);
    return msg;

};
RG.extend2(RG.RogueItemWeapon, RG.RogueItem);
RG.extend2(RG.RogueItemWeapon, RG.DamageObject);

/** Base object for armour.*/
RG.RogueItemArmour = function(name) {
    RG.RogueItem.call(this, name);
    RG.DefenseObject.call(this);
    this.setType("armour");

    var _armourType = null;

    this.setArmourType = function(type) {_armourType = type;};
    this.getArmourType = function() {return _armourType;};

};
RG.extend2(RG.RogueItemArmour, RG.RogueItem);
RG.extend2(RG.RogueItemArmour, RG.DefenseObject);

/** Potion object which restores hit points .*/
RG.RogueItemPotion = function(name) {
    RG.RogueItem.call(this, name);
    this.setType("potion");

    this.useItem = function(obj) {
        if (obj.hasOwnProperty("target")) {
            var target = obj.target;
            var die = new RG.Die(1, 10, 2);
            var pt = die.roll();
            if (target.has("Health")) {
                target.get("Health").addHP(pt);
                var msg = {item: this};
                RG.POOL.emitEvent(RG.EVT_DESTROY_ITEM, msg);
            }
        }
        else {
            RG.err("ItemPotion", "useItem", "No target given in obj.");
        }
    };

};
RG.extend2(RG.RogueItemPotion, RG.RogueItem);

/** Models an object which is used as a missile.*/
RG.RogueItemMissile = function(name) {
    RG.RogueItem.call(this, name);
    RG.DamageObject.call(this);
    RG.Entity.call(this);
    this.setType("missile");

};
RG.extend2(RG.RogueItemMissile, RG.RogueItem);
RG.extend2(RG.RogueItemMissile, RG.DamageObject);
RG.extend2(RG.RogueItemMissile, RG.Entity);

/** Models an item container. Can hold a number of items.*/
RG.RogueItemContainer = function(owner) {
    RG.RogueItem.call(this, "container");
    this.setOwner(owner);

    var _items = [];
    var _iter  = 0;

    /** Adds an item. Container becomes item's owner.*/
    this.addItem = function(item) {
        if (item.getType() === "container") {
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
        //console.log("removeItem Index is " + index);
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

/** Spirit items are wearables which can have powerful use abilities as well.*/
RG.RogueItemSpirit = function(name) {
    RG.RogueItem.call(this, name);
    RG.Entity.call(this);
    this.setType("spirit");

    this.getArmourType = function() {return "spirit";};

    var stats = new RG.StatsComponent();
    this.add("Stats", stats);

};
RG.extend2(RG.RogueItemSpirit, RG.RogueItem);
RG.extend2(RG.RogueItemSpirit, RG.Entity);

//---------------------------------------------------------------------------
// EQUIPMENT AND INVENTORY
//---------------------------------------------------------------------------

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

    /** Equips given item to first available place in slot.*/
    this.equipItem = function(item) {
        if (this.canEquip(item)) {
            item.setOwner(this);
            _items.push(item);
            return true;
        }
        return false;
    };

    /** Unequips from given slot. */
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

    var _equipped = [];

    var _slots = {
        hand: new RG.RogueEquipSlot(this, "hand", 2),
        head: new RG.RogueEquipSlot(this, "head", 1),
        chest: new RG.RogueEquipSlot(this, "chest", 1),
        neck: new RG.RogueEquipSlot(this, "neck", 1),
        feet: new RG.RogueEquipSlot(this, "feet", 1),
        missile: new RG.RogueEquipSlot(this, "missile", 1),
        spirit: new RG.RogueEquipSlot(this, "spirit", 1),
    };

    this.getSlotTypes = function() {return Object.keys(_slots);};

    this.getItems = function(slot) {
        if (_slots.hasOwnProperty(slot)) {
            return _slots[slot].getItems();
        }
        return [];
    };

    /** Equips given item. Slot is chosen automatically from suitable available
     * ones.*/
    this.equipItem = function(item) {
        // TODO add proper checks for equipping
        if (item.hasOwnProperty("getArmourType")) {
            if (_slots[item.getArmourType()].equipItem(item)) {
                _equipped.push(item);
                return true;
            }
        }
        else { // No equip property, can only equip to hand
            if (item.getType() === "missile") {
                if (_slots.missile.equipItem(item)) {
                    _equipped.push(item);
                    return true;
                }
            }
            else if (_slots.hand.equipItem(item)) {
                _equipped.push(item);
                return true;
            }
        }
        return false;
    };

    /** Returns true if given item is equipped.*/
    this.isEquipped = function(item) {
        var index = _equipped.indexOf(item);
        return index !== -1;
    };

    this.getEquipped = function(slotType) {
        return _slots[slotType].getItems();
    };

    /** Unequips given slotType and index. */
    this.unequipItem = function(slotType, n) {
        if (_slots.hasOwnProperty(slotType)) {
            var items = _slots[slotType].getItems();
                var item = items[n];
            if (_slots[slotType].unequipItem(n)) {
                var index = _equipped.indexOf(item);
                if (index >= 0) {
                    _equipped.splice(index, 1);
                    return true;
                }
                else {
                    RG.err("Equipment", "unequipItem", "Index < 0. Horribly wrong.");
                }
            }
        }
        else {
            var msg = "Non-existing slot type " + slotType;
            RG.err("Equipment", "unequipItem", msg);
        }
        return false;
    };

    this.propertySum = function(funcname) {
        var result = 0;
        for (var slot in _slots) {
            var items = this.getItems(slot);
            for (var i = 0; i < items.length; i++) {
                if (items[i].hasOwnProperty(funcname)) {
                    result += items[i][funcname]();
                }
            }
        }
        return result;
    };

    // Dynamically generated accessors for different stats 
    var _mods = ["getDefense", "getAttack", "getProtection", "getSpeed", "getWillpower",
        "getAccuracy", "getAgility"];

    for (var i = 0; i < _mods.length; i++) {
        this[_mods[i]] = function() {return this.propertySum(_mods[i]);};
    }

    /*
    this.getDefense = function() {return this.propertySum("getDefense");};
    this.getAttack = function() {return this.propertySum("getAttack");};
    this.getProtection = function() {return this.propertySum("getProtection");};
    */

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
    this.addItem = function(item) {_inv.addItem(item);};
    this.hasItem = function(item) {return _inv.hasItem(item);};
    this.removeItem = function(item) {return _inv.removeItem(item);};

    this.useItem = function(item, obj) {
        if (_inv.hasItem(item)) {
            if (item.hasOwnProperty("useItem")) {
                item.useItem(obj);
                return true;
            }
        }
        else {
            RG.err("InvAndEquip", "useItem", "Not in inventory, cannot use!");
        }
        return false;
    };

    /** Drops selected item to the actor's current location.*/
    this.dropItem = function(item) {
        if (_inv.removeItem(item)) {
            var level = _actor.getLevel();
            if (level.addItem(item, _actor.getX(), _actor.getY())) {
                return true;
            }
            else {
                _inv.addItem(item);
            }
        }
        return false;
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
    this.unequipItem = function(slotType, n) {
        var eqItems = _eq.getItems(slotType);
        if (n < eqItems.length) {
            var item = eqItems[n];
            if (_eq.unequipItem(slotType, n)) {
                this.addItem(item);
                return true;
            }
        }
        return false;
    };

    this.unequipAndGetItem = function(slotType, n) {
        var eqItems = _eq.getItems(slotType);
        if (n < eqItems.length) {
            return eqItems.pop();
        }
        return null;
    };

    this.getWeapon = function() {
        var items = _eq.getItems("hand");
        if (items.length > 0) {
            return items[0];
        }
        return null;
    };


};
RG.extend2(RG.RogueInvAndEquip, RG.Ownable);

/** Object representing a game actor who takes actions.  */
RG.RogueActor = function(name) { // {{{2
    RG.Locatable.call(this);
    RG.Entity.call(this);
    this.setPropType("actors");

    // Member vars
    var _brain = new RG.RogueBrain(this);
    var _isPlayer = false;
    var _fovRange = RG.FOV_RANGE;
    var _name = name;
    var _invEq = new RG.RogueInvAndEquip(this);

    this.add("Action", new RG.ActionComponent());
    this.add("Experience", new RG.ExperienceComponent());
    this.add("Combat", new RG.CombatComponent());
    this.add("Stats", new RG.StatsComponent());
    this.add("Health", new RG.HealthComponent(50));

    this.setName = function(name) {_name = name;};
    this.getName = function() {return _name;};

    this.setIsPlayer = function(isPlayer) {
        _isPlayer = isPlayer;
        if (isPlayer) {
            _brain = new RG.PlayerBrain(this);
        }
    };

    this.addEnemy = function(actor) {_brain.addEnemy(actor);};
    this.setBrain = function(brain) {
        _brain = brain;
        _brain.setActor(this);
    };

    /** Returns true if actor is a player.*/
    this.isPlayer = function() {
        return _isPlayer;
    };

    this.getWeapon = function() {
        return _invEq.getWeapon();
    };

    /** Returns missile equipped by the player.*/
    this.getMissile = function() {
        return _invEq.getEquipment().getItems("missile")[0];
    };

    /** Returns the next action for this actor.*/
    this.nextAction = function(obj) {
        // Use actor brain to determine the action
        var cb = _brain.decideNextAction(obj);
        var action = null;

        if (cb !== null) {
            var speed = this.get("Stats").getSpeed();
            var duration = parseInt(RG.BASE_SPEED/speed * RG.ACTION_DUR);
            action = new RG.RogueAction(duration, cb, {});
        }
        else {
            action = new RG.RogueAction(0, function(){}, {});
        }

        if (action !== null) {
            if (_brain.hasOwnProperty("energy")) action.energy = _brain.energy;
            action.actor = this;
        }
        return action;
    };

    this.getFOVRange = function() { return _fovRange;};
    this.setFOVRange = function(range) {_fovRange = range;};

    this.getInvEq = function() {
        return _invEq;
    };

    this.getEquipAttack = function() {
        return _invEq.getEquipment().getAttack();
    };

    this.getEquipDefense = function() {
        return _invEq.getEquipment().getDefense();
    };

    this.getEquipProtection = function() {
        return _invEq.getEquipment().getProtection();
    };

};
RG.extend2(RG.RogueActor, RG.Locatable);
RG.extend2(RG.RogueActor, RG.Entity);

// }}} Actor

/** Element is a wall or other obstacle or a feature in the map. It's not
 * necessarily blocking movement.  */
RG.RogueElement = function(elemType) { // {{{2
    RG.Locatable.call(this);
    this.setPropType("elements");
    this.setType(elemType);

    var _elemType = elemType.toLowerCase();
    var _allowMove;

    switch(elemType) {
        case "wall": _allowMove = false; break;
        case "floor": _allowMove = true; break;
        default: _allowMove = true; break;
    }

    this.canMove = function() {
        return _allowMove;
    };

};
RG.extend2(RG.RogueElement, RG.Locatable);
// }}} Element

/** Object models stairs connecting two levels. Stairs are one-way, thus
 * connecting 2 levels requires two stair objects. */
RG.RogueStairsElement = function(down, srcLevel, targetLevel) {
    if (down)
        RG.RogueElement.call(this, "stairsDown");
    else
        RG.RogueElement.call(this, "stairsUp");

    var _down = down;
    var _srcLevel = srcLevel;
    var _targetLevel = targetLevel;
    var _targetStairs = null;

    /** Target actor uses the stairs.*/
    this.useStairs = function(actor) {
        if (!RG.isNullOrUndef([_targetStairs, _targetLevel])) {
            var newLevel = _targetLevel;
            var newX = _targetStairs.getX();
            var newY = _targetStairs.getY();
            if (_srcLevel.removeActor(actor)) {
                if (_targetLevel.addActor(actor, newX, newY)) {
                    RG.POOL.emitEvent(RG.EVT_LEVEL_CHANGED,
                        {target: _targetLevel, src: _srcLevel, actor: actor});
                    RG.POOL.emitEvent(RG.EVT_LEVEL_ENTERED, {actor: actor, target:
                        targetLevel});
                    return true;
                }
            }
        }
        return false;
    };

    this.isDown = function() {return _down;};

    this.getSrcLevel = function() {return _srcLevel; };
    this.setSrcLevel = function(src) {_srcLevel = src;};

    this.getTargetLevel = function() {return _targetLevel; };
    this.setTargetLevel = function(target) {_targetLevel = target;};

    this.setTargetStairs = function(stairs) {_targetStairs = stairs;};
    this.getTargetStairs = function() {return _targetStairs;};

};
RG.extend2(RG.RogueStairsElement, RG.RogueElement);

/** Models an action. Each action has a duration and a callback.  */
RG.RogueAction = function(dur, cb, obj) { // {{{2

    var _duration = dur;
    var _cb = cb; // Action callback
    var _energy = 0;

    this.setEnergy = function(en) {_energy = en;};
    this.getEnergy = function() {return _energy;};


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

    var _guiCallbacks = {}; // For attaching GUI callbacks

    this.addGUICallback = function(code, callback) {
        _guiCallbacks[code] = callback;
    };

    this.energy = 1;

    this.decideNextAction = function(obj) {
        if (obj.hasOwnProperty("cmd")) {
            return function() {};
        }

        var code = obj.code;
        var level = _actor.getLevel();

        // Invoke GUI callback with given code
        if (_guiCallbacks.hasOwnProperty(code)) {
            _guiCallbacks[code](code);
            return null;
        }

        // Need existing position
        var x = _actor.getX();
        var y = _actor.getY();
        var xOld = x;
        var yOld = y;
        var currCell = level.getMap().getCell(x, y);

        var type = "NULL";
        if (code === ROT.VK_D) { ++x; type = "MOVE";}
        if (code === ROT.VK_A) { --x; type = "MOVE";}
        if (code === ROT.VK_W) { --y; type = "MOVE";}
        if (code === ROT.VK_X) { ++y; type = "MOVE";}
        if (code === ROT.VK_Q) {--y; --x; type = "MOVE";}
        if (code === ROT.VK_E) {--y; ++x; type = "MOVE";}
        if (code === ROT.VK_C) {++y; ++x; type = "MOVE";}
        if (code === ROT.VK_Z) {++y; --x; type = "MOVE";}
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

        if (code === ROT.VK_COMMA) {
            type = "STAIRS";
            if (currCell.hasStairs()) {
                return function() {level.useStairs(_actor);};
            }
            else {
                return null;
            }
        }

        if (type === "MOVE") {
            if (level.getMap().hasXY(x, y)) {
                if (level.getMap().isPassable(x, y)) {
                    return function() {
                        var movComp = new RG.MovementComponent(x, y, level);
                        _actor.add("Movement", movComp);
                    };
                }
                else if (level.getMap().getCell(x,y).hasProp("actors")) {
                    return function() {
                        var target = level.getMap().getCell(x, y).getProp("actors")[0];
                        var attackComp = new RG.AttackComponent(target);
                        _actor.add("Attack", attackComp);
                    };
                }
            }
        }
        else if (type === "IDLE") {
            return function() {};
        }

        return null; // Null action
    };

    this.addEnemy = function(actor) {};

}; // }}} PlayerBrain


/** Memory is used by the actor to hold information about enemies, items etc.
 * It's a separate object from decision-making brain.*/
RG.RogueBrainMemory = function(brain) {

    var _enemies = []; // List of enemies for this actor
    var _enemyTypes = []; // List of enemy types for this actor
    var _communications = [];

    this.addEnemyType = function(type) {_enemyTypes.push(type);};

    /** Checks if given actor is an enemy. */
    this.isEnemy = function(actor) {
        var index = _enemies.indexOf(actor);
        if (index !== -1) return true;
        var type = actor.getType();
        index = _enemyTypes.indexOf(type);
        if (index !== -1) return true;
        return false;
    };

    /** Adds given actor as (personal) enemy.*/
    this.addEnemy = function(actor) {
        if (!this.isEnemy(actor)) {
            _enemies.push(actor);
            _communications = []; // Invalidate communications
        }
    };

    this.getEnemies = function() {return _enemies;};

    /** Adds a communication with given actor. */
    this.addCommunicationWith = function(actor) {
        if (!this.hasCommunicatedWith(actor)) {
            _communications.push(actor);
        }
    };

    /** Returns true if has communicated with given actor.*/
    this.hasCommunicatedWith = function(actor) {
        var index = _communications.indexOf(actor);
        return index !== -1;
    };

};

/** Brain is used by the AI to perform and decide on actions. Brain returns
 * actionable callbacks but doesn't know Action objects.  */
RG.RogueBrain = function(actor) { // {{{2

    var _actor = actor; // Owner of the brain
    var _explored = {}; // Memory of explored cells

    var _memory = new RG.RogueBrainMemory(this);

    this.getMemory = function() {return _memory;};

    this.setActor = function(actor) {_actor = actor;};
    this.getActor = function() {return _actor;};

    this.addEnemy = function(actor) {_memory.addEnemy(actor);};

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

    // Convenience methods (for child classes)
    this.getSeenCells = function() {
        return _actor.getLevel().getMap().getVisibleCells(_actor);
    };

    /** Main function for retrieving the actionable callback. Acting actor must
     * be passed in. */
    this.decideNextAction = function(obj) {
        var seenCells = this.getSeenCells();
        var playerCell = this.findEnemyCell(seenCells);

        // We have found the player
        if (!RG.isNullOrUndef([playerCell])) { // Move or attack
            return this.actionTowardsEnemy(playerCell);
        }
        return this.exploreLevel(seenCells);
    };

    /** Takes action towards given enemy cell.*/
    this.actionTowardsEnemy = function(enemyCell) {
        var level = _actor.getLevel();
        var playX = enemyCell.getX();
        var playY = enemyCell.getY();
        if (this.canAttack(playX, playY)) {
            return function() {
                var cell = level.getMap().getCell(playX, playY);
                var target = cell.getProp("actors")[0];
                var attackComp = new RG.AttackComponent(target);
                _actor.add("Attack", attackComp);
            };
        }
        else { // Move closer
            var pathCells = this.getShortestPathTo(enemyCell);
            if (pathCells.length > 1) {
                var pathX = pathCells[1].getX();
                var pathY = pathCells[1].getY();
                return function() {
                    var movComp = new RG.MovementComponent(pathX, pathY, level);
                    _actor.add("Movement", movComp);
                };
            }
            else { // Cannot move anywhere, no action
                return function() {};
            }
        }
    };

    this.exploreLevel = function(seenCells) {
        var level = _actor.getLevel();
        // Wander around exploring
        var index = -1;
        for (var i = 0, ll = seenCells.length; i < ll; i++) {
            if (seenCells[i].isFree()) {
                var xy = seenCells[i].getX() + "," + seenCells[i].getY();
                if (!_explored.hasOwnProperty(xy)) {
                    _explored[xy] = true;
                    index = i;
                    break;
                }
            }
        }

        if (index === -1) { // Everything explored, choose random cell
            index = Math.floor(Math.random() * (seenCells.length));
        }
        return function() {
            var x = seenCells[index].getX();
            var y = seenCells[index].getY();
            var movComp = new RG.MovementComponent(x, y, level);
            _actor.add("Movement", movComp);
        };

    };

    /** Checks if the actor can attack given x,y coordinate.*/
    this.canAttack = function(x, y) {
        var actorX = _actor.getX();
        var actorY = _actor.getY();
        var attackRange = _actor.get("Combat").getAttackRange();
        var getDist = RG.shortestDist(x, y, actorX, actorY);
        if (getDist <= attackRange) return true;
        return false;
    };

    /** Given a list of cells, returns a cell with an enemy in it or null.*/
    this.findEnemyCell = function(seenCells) {
        for (var i = 0, iMax=seenCells.length; i < iMax; i++) {
            if (seenCells[i].hasProp("actors")) {
                var actors = seenCells[i].getProp("actors");
                if (actors[0].isPlayer()) return seenCells[i];
                else if (_memory.isEnemy(actors[0])) return seenCells[i];
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

/** Brain used by most of the animals. TODO: Add some corpse eating behaviour. */
RG.AnimalBrain = function(actor) {
    RG.RogueBrain.call(this, actor);

    var _memory = this.getMemory();
    _memory.addEnemyType("player");
    _memory.addEnemyType("human");

    this.findEnemyCell = function(seenCells) {
        var memory = this.getMemory();
        for (var i = 0, iMax=seenCells.length; i < iMax; i++) {
            if (seenCells[i].hasProp("actors")) {
                var actors = seenCells[i].getProp("actors");
                if (memory.isEnemy(actors[0]))
                    return seenCells[i];
            }
        }
        return null;
    };

};
RG.extend2(RG.AnimalBrain, RG.RogueBrain);

/** Brain used by most of the animals. TODO: Add some corpse eating behaviour. */
RG.DemonBrain = function(actor) {
    RG.RogueBrain.call(this, actor);

    var _memory = this.getMemory();
    _memory.addEnemyType("player");
    _memory.addEnemyType("human");

    this.findEnemyCell = function(seenCells) {
        var memory = this.getMemory();
        for (var i = 0, iMax=seenCells.length; i < iMax; i++) {
            if (seenCells[i].hasProp("actors")) {
                var actors = seenCells[i].getProp("actors");
                if (memory.isEnemy(actors[0]))
                    return seenCells[i];
            }
        }
        return null;
    };

};
RG.extend2(RG.DemonBrain, RG.RogueBrain);


RG.ZombieBrain = function(actor) {
    RG.RogueBrain.call(this, actor);
};
RG.extend2(RG.ZombieBrain, RG.RogueBrain);

/** Brain used by summoners. */
RG.SummonerBrain = function(actor) {
    RG.RogueBrain.call(this, actor);

    var _actor = actor;
    this.numSummoned = 0;
    this.maxSummons = 20;

    this.decideNextAction = function(obj) {
        var level = _actor.getLevel();
        var seenCells = this.getSeenCells();
        var playerCell = this.findEnemyCell(seenCells);

        // We have found the player
        if (!RG.isNullOrUndef([playerCell])) { // Move or attack
            if (this.summonedMonster()) {
                return function() {};
            }
            else {
                return this.actionTowardsEnemy(playerCell);
            }
        }
        return this.exploreLevel(seenCells);

    };

    /** Tries to summon a monster to a nearby cell. Returns true if success.*/
    this.summonedMonster = function() {
        if (this.numSummoned === this.maxSummons) return false;

        var summon = Math.random();
        if (summon > 0.8) {
            var level = _actor.getLevel();
            var cellsAround = this.getFreeCellsAround();
            if (cellsAround.length > 0) {
                var freeX = cellsAround[0].getX();
                var freeY = cellsAround[0].getY();
                var summoned = RG.FACT.createMonster("Summoned",
                    {hp: 15, att: 7, def: 7});
                summoned.get("Experience").setExpLevel(5);
                level.addActor(summoned, freeX, freeY);
                RG.gameMsg(_actor.getName() + " summons some help");
                this.numSummoned += 1;
                return true;
            }
            else {
                var txt = " screamed incantation but nothing happened";
                RG.gameMsg(_actor.getName() + txt);
            }
        }
        return false;

    };

    /** Returns a list of cells in 3x3 around the actor with the brain.*/
    this.getCellsAround = function() {
        var map = _actor.getLevel().getMap();
        var x = _actor.getX();
        var y = _actor.getY();
        var cells = [];
        for (var xx = x-1; xx <= x+1; xx++) {
            for (var yy = y-1; yy <= y+1; yy++) {
                if (map.hasXY(xx, yy))
                    cells.push(map.getCell(xx, yy));
            }
        }
        return cells;
    };

    this.getFreeCellsAround = function() {
        var cellAround = this.getCellsAround();
        var freeCells = [];
        for (var i = 0; i < cellAround.length; i++) {
            if (cellAround[i].isFree()) freeCells.push(cellAround[i]);
        }
        return freeCells;
    };

};
RG.extend2(RG.SummonerBrain, RG.RogueBrain);

/** This brain is used by humans who are not hostile to the player.*/
RG.HumanBrain = function(actor) {
    RG.RogueBrain.call(this, actor);
    var _actor = actor;

    this.getMemory().addEnemyType("demon");

    this.decideNextAction = function(obj) {
        var level = _actor.getLevel();
        var seenCells = this.getSeenCells();
        var enemyCell = this.findEnemyCell(seenCells);
        var friendCell = this.findFriendCell(seenCells);
        var friendActor = null;
        var memory = this.getMemory();

        var comOrAttack = Math.random();
        if (RG.isNullOrUndef([friendCell])) {
            comOrAttack = 1.0;
        }
        else {
            friendActor = friendCell.getProp("actors")[0];
            if (memory.hasCommunicatedWith(friendActor)) {
                comOrAttack = 1.0;
            }
        }

        // We have found the enemy
        if (!RG.isNullOrUndef([enemyCell]) && comOrAttack > 0.5) { // Move or attack
            return this.actionTowardsEnemy(enemyCell);
        }
        else {
            if (friendActor !== null) { // Communicate enemies
                var comComp = new RG.CommunicationComponent();
                var enemies = memory.getEnemies();
                var msg = {type: "Enemies", enemies: enemies};
                comComp.addMsg(msg);
                if (!friendActor.has("Communication")) {
                    friendActor.add("Communication", comComp);
                }
                memory.addCommunicationWith(friendActor);
            }
        }
        return this.exploreLevel(seenCells);

    };

    this.findEnemyCell = function(seenCells) {
        var memory = this.getMemory();
        for (var i = 0, iMax=seenCells.length; i < iMax; i++) {
            if (seenCells[i].hasProp("actors")) {
                var actors = seenCells[i].getProp("actors");
                if (memory.isEnemy(actors[0]))
                    return seenCells[i];
            }
        }
        return null;
    };

    /** Finds a friend cell among seen cells.*/
    this.findFriendCell = function(seenCells) {
        var memory = this.getMemory();
        for (var i = 0, iMax=seenCells.length; i < iMax; i++) {
            if (seenCells[i].hasProp("actors")) {
                var actors = seenCells[i].getProp("actors");
                if (actors[0] !== _actor) { // Exclude itself
                    if (!memory.isEnemy(actors[0])) return seenCells[i];
                }
            }
        }
        return null;
    };

};

RG.extend2(RG.HumanBrain, RG.RogueBrain);

// }}} BRAINS

//---------------------------------------------------------------------------
// GAME EVENTS
//---------------------------------------------------------------------------

/** Event is something that is scheduled and takes place but it's not an actor.
 * An example is regeneration or poison effect.*/
RG.RogueGameEvent = function(dur, cb, repeat, offset) {

    var _cb = cb;
    var _repeat = repeat;
    var _nTimes = 1;
    var _offset = offset;

    var _level = null; // Level associated with the event, if null, global

    this.isEvent = true; // Needed for the scheduler

    /** Clunky for events, but must implement for the scheduler.*/
    this.isPlayer = function(){return false;};

    this.nextAction = function() {
        return new RG.RogueAction(dur, cb, {});
    };

    this.getRepeat = function() {return _repeat;};
    this.setRepeat = function(repeat) {_repeat = repeat;};

    this.getOffset = function() {return _offset;};
    this.setOffset = function(offset) {_offset = offset;};

    this.setLevel = function(level) {_level = level;};
    this.getLevel = function() {return _level;};

};

/** Regeneration event. Initialized with an actor. */
RG.RogueRegenEvent = function(actor, dur) {

    var _dur = dur; // Duration between events

    var _regenerate = function() {
        var maxHP = actor.get("Health").getMaxHP();
        var hp = actor.get("Health").getHP();
        hp += 1;
        if (hp <= maxHP) {
            actor.get("Health").setHP(hp);
            RG.gameMsg(actor.getName() + " regenerates 1 HP");
        }
    };

    RG.RogueGameEvent.call(this, _dur, _regenerate, true);
};
RG.extend2(RG.RogueRegenEvent, RG.RogueGameEvent);

/** Event that is executed once after an offset.*/
RG.RogueOneShotEvent = function(cb, offset, msg) {

    // Wraps the callback into function and emits a message
    var _cb = function() {
        if (!RG.isNullOrUndef([msg])) {
            RG.gameMsg(msg);
        }
        cb();
    };

    RG.RogueGameEvent.call(this, 0, _cb, false, offset);
};
RG.extend2(RG.RogueOneShotEvent, RG.RogueGameEvent);


/** Scheduler for the game actions.  */
RG.RogueScheduler = function() { // {{{2

    // Internally use ROT scheduler
    var _scheduler = new ROT.Scheduler.Action();

    // Store the scheduled events
    var _events = [];
    var _actors = [];

    /** Adds an actor or event to the scheduler.*/
    this.add = function(actOrEvent, repeat, offset) {
        _scheduler.add(actOrEvent, repeat, offset);
        if (actOrEvent.hasOwnProperty("isEvent")) {
            _events.push(actOrEvent);

        }
        else {
            _actors.push(actOrEvent);
        }
    };

    // Returns next actor/event or null if no next actor exists.
    this.next = function() {
        return _scheduler.next();
    };

    /** Must be called after next() to re-schedule next slot for the
     * actor/event.*/
    this.setAction = function(action) {
        _scheduler.setDuration(action.getDuration());
    };

    /** Tries to remove an actor/event, Return true if success.*/
    this.remove = function(actOrEvent) {
        if (actOrEvent.hasOwnProperty("isEvent")) {
            return this.removeEvent(actOrEvent);
        }
        else {
            var index = _actors.indexOf(actOrEvent);
            if (index !== -1) _events.splice(index, 1);
        }
        return _scheduler.remove(actOrEvent);
    };

    /** Removes an event from the scheduler. Returns true on success.*/
    this.removeEvent = function(evt) {
        var index = - 1;
        if (actOrEvent.hasOwnProperty("isEvent")) {
            index = _events.indexOf(actor);
            if (index !== -1) _events.splice(index, 1);
        }
        return _scheduler.remove(evt);

    };

    this.getTime = function() {
        return _scheduler.getTime();
    };

    /** Hooks to the event system. When an actor is killed, removes it from the
     * scheduler.*/
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

    var _types = ["arena", "cellular", "digger", "divided", "dungeon",
        "eller", "icey", "uniform", "rogue", "ruins", "rooms"];

    var _wall = 1;

    this.getRandType = function() {
        var len = _types.length;
        var nRand = Math.floor(Math.random() * len);
        return _types[nrand];
    };

    var _nHouses = 5;
    this.setNHouses = function(nHouses) {_nHouses = nHouses;};

    /** Sets the generator for room generation.*/
    this.setGen = function(type, cols, rows) {
        this.cols = cols;
        this.rows = rows;
        type = type.toLowerCase();
        switch(type) {
            case "arena":  _mapGen = new ROT.Map.Arena(cols, rows); break;
            case "cellular":  _mapGen = this.createCellular(cols, rows); break;
            case "digger":  _mapGen = new ROT.Map.Digger(cols, rows); break;
            case "divided":  _mapGen = new ROT.Map.DividedMaze(cols, rows); break;
            case "dungeon":  _mapGen = new ROT.Map.Dungeon(cols, rows); break;
            case "eller":  _mapGen = new ROT.Map.EllerMaze(cols, rows); break;
            case "icey":  _mapGen = new ROT.Map.IceyMaze(cols, rows); break;
            case "rogue":  _mapGen = new ROT.Map.Rogue(cols, rows); break;
            case "uniform":  _mapGen = new ROT.Map.Uniform(cols, rows); break;
            case "ruins": _mapGen = this.createRuins(cols, rows); break;
            case "rooms": _mapGen = this.createRooms(cols, rows); break;
            //case "town": _mapGen = this.createTown(cols, rows, _nHouses); break;
            default: RG.err("MapGen", "setGen", "_mapGen type " + type + " is unknown");
        }
    };

    /** Returns a randomized map based on initialized generator settings.*/
    this.getMap = function() {
        var map = new RG.Map(this.cols, this.rows);
        _mapGen.create(function(x, y, val) {
            if (val === _wall) {
                map.setBaseElemXY(x, y, new RG.RogueElement("wall"));
            }
            else {
                map.setBaseElemXY(x, y, new RG.RogueElement("floor"));
            }
        });
        return map;
    };

    /** Creates "ruins" type level with open outer edges and inner fortress with
     * some tunnels. */
    this.createRuins = function(cols, rows) {
        var conf = {born: [4, 5, 6, 7, 8],
            survive: [2, 3, 4, 5], connected: true};
        var map = new ROT.Map.Cellular(cols, rows, conf);
        map.randomize(0.9);
        for (var i = 0; i < 5; i++) map.create();
        map.connect(null, 1);
        _wall = 0;
        return map;
    };

    /** Creates a cellular type dungeon and makes all areas connected.*/
    this.createCellular = function(cols, rows, gens) {
        var map = new ROT.Map.Cellular(cols, rows);
        map.randomize(0.5);
        for (var i = 0; i < 5; i++) map.create();
        map.connect(null, 1);
        _wall = 0;
        return map;
    };

    this.createRooms = function(cols, rows) {
        var map = new ROT.Map.Digger(cols, rows, 
            {roomWidth: [5, 20], dugPercentage: 0.7});
        return map;
    };

    /** Creates a town level of size cols X rows. */
    this.createTown = function(cols, rows, conf) {
        var maxTriesHouse = 100;
        var doors = {};
        var wallsHalos = {};

        var nHouses = 5;
        var minX = 5;
        var maxX = 5;
        var minY = 5;
        var maxY = 5;

        if (conf.hasOwnProperty("nHouses")) nHouses = conf.nHouses;
        if (conf.hasOwnProperty("minHouseX")) minX = conf.minHouseX;
        if (conf.hasOwnProperty("minHouseY")) minY = conf.minHouseY;
        if (conf.hasOwnProperty("maxHouseX")) maxX = conf.maxHouseX;
        if (conf.hasOwnProperty("maxHouseY")) maxY = conf.maxHouseY;

        this.setGen("arena", cols, rows);
        var map = this.getMap();
        for (var i = 0; i < nHouses; i++) {

            var houseCreated = false;
            var tries = 0;
            var xSize = Math.floor(Math.random() * (maxX - minX)) + minX;
            var ySize = Math.floor(Math.random() * (maxY - minY)) + minY;

            while (!houseCreated && tries < maxTriesHouse) {
                var x0 = Math.floor(Math.random() * cols);
                var y0 = Math.floor(Math.random() * rows);
                houseCreated = this.createHouse(map, x0, y0, xSize, ySize, doors, wallsHalos);
                ++tries;
            }

        }
        return map;
    };

    /** Creates a house into a given map to a location x0,y0 with given
     * dimensions. Existing doors and walls must be passed to prevent
     * overlapping.*/
    this.createHouse = function(map, x0, y0, xDim, yDim, doors, wallsHalos) {
        var maxX = x0 + xDim;
        var maxY = y0 + yDim;
        var wallCoords = [];

        // House doesn't fit on the map
        if (maxX >= map.cols) return false;
        if (maxY >= map.rows) return false;

        var possibleRoom = [];
        var wallXY = RG.Geometry.getHollowBox(x0, y0, maxX, maxY);

        // Store x,y for house until failed
        for (var i = 0; i < wallXY.length; i++) {
            var x = wallXY[i][0];
            var y = wallXY[i][1];
            if (map.hasXY(x, y)) {
                if (wallsHalos.hasOwnProperty(x + "," + y)) {
                    return false;
                }
                else {
                    if (!doors.hasOwnProperty(x + "," + y)) {
                        possibleRoom.push([x, y]);
                        // Exclude map border from door generation
                        if (!map.isBorderXY(x, y)) wallCoords.push([x, y]);
                    }
                }
            }
        }

        // House generation has succeeded at this point, true will be returned

        // Didn't fail, now we can build the actual walls
        for (var i = 0; i < possibleRoom.length; i++) {
            var roomX = possibleRoom[i][0];
            var roomY = possibleRoom[i][1];
            map.setBaseElemXY(roomX, roomY, new RG.RogueElement("wall"));
        }

        // Create the halo, prevents houses being too close to each other
        var haloX0 = x0 - 1;
        var haloY0 = y0 - 1;
        var haloMaxX = maxX + 1;
        var haloMaxY = maxY + 1;
        var haloBox = RG.Geometry.getHollowBox(haloX0, haloY0, haloMaxX, haloMaxY);
        for (var i = 0; i < haloBox.length; i++) {
            var haloX = haloBox[i][0];
            var haloY = haloBox[i][1];
            wallsHalos[haloX + "," + haloY] = true;
        }

        // Finally randomly insert the door for the house
        var coordLength = wallCoords.length - 1;
        var doorIndex = Math.floor(Math.random() * coordLength);
        var doorX = wallCoords[doorIndex][0];
        var doorY = wallCoords[doorIndex][1];

        // At the moment, "door" is a hole in the wall
        map.setBaseElemXY(doorX, doorY, new RG.RogueElement("floor"));
        doors[doorX + "," + doorY] = true;

        for (var i = 0; i < wallCoords.length; i++) {
            var x = wallCoords[i][0];
            var y = wallCoords[i][1];
            wallsHalos[x + "," + y] = true;
        }
        return true;
    };

}; // }}} RogueMapGen


/** Contains generic 2D geometric functions for square/rectangle/etc
 * generation.*/
RG.Geometry = {

    /** Given start x,y and end x,y coordinates, returns all x,y coordinates in
     * the border of the rectangle.*/
    getHollowBox: function(x0, y0, maxX, maxY) {
        var res = [];
        for (var x = x0; x <= maxX; x++) {
            for (var y = y0; y <= maxY; y++) {
                if ((y === y0 || y === maxY || x === x0 || x === maxX) ) {
                    res.push([x, y]);
                }
            }
        }
        return res;
    },

};

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

    /** Sets/gets the base element for this cell. There can be only one element.*/
    this.setBaseElem = function(elem) { _baseElem = elem; };
    this.getBaseElem = function() { return _baseElem; };

    /** Returns true if it's possible to move to this cell.*/
    this.isFree = function() {
        return _baseElem.getType() !== "wall" &&
            !this.hasProp("actors");
    };

    /** Add given obj has specified property.*/
    this.setProp = function(prop, obj) {
        if (_p.hasOwnProperty(prop)) {
            _p[prop].push(obj);
            if (obj.hasOwnProperty("setOwner")) {
                obj.setOwner(this);
            }
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
        return false;
    };

    this.hasStairs = function() {
        return this.hasPropType("stairsUp") || this.hasPropType("stairsDown");
    };

    this.getStairs = function() {
        if (this.hasPropType("stairsUp")) return this.getPropType("stairsUp")[0];
        if (this.hasPropType("stairsDown")) return this.getPropType("stairsDown")[0];
    };

    /** Returns true if any cell property has the given type. Ie.
     * myCell.hasPropType("wall"). Doesn't check for basic props like "actors",
     * RG.TYPE_ITEM etc.
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

    /** Returns all props with given type in the cell.*/
    this.getPropType = function(propType) {
        var props = [];
        if (_baseElem.getType() === propType) return [_baseElem];
        for (var prop in _p) {
            var arrProps = _p[prop];
            for (var i = 0; i < arrProps.length; i++) {
                if (arrProps[i].getType() === propType) {
                    props.push(arrProps[i]);
                }
            }
        }
        return props;
    };

    this.getProp = function(prop) {
        if (_p.hasOwnProperty(prop)) {
            return _p[prop];
        }
        return null;
    };

    /** Returns true if light passes through this map cell.*/
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

    /** Returns string representation of the cell.*/
    this.toString = function() {
        var str = "MapCell " + _x + ", " + _y;
        str += " explored: " + _explored;
        str += " passes light: " + this.lightPasses();
        for (var prop in _p) {
            var arrProps = _p[prop];
            for (var i = 0; i < arrProps.length; i++) {
                if (arrProps[i].hasOwnProperty("toString")) {
                    str += arrProps[i].toString();
                }
            }
        }
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

    var fov = new ROT.FOV.PreciseShadowcasting(lightPasses);

    /** Returns visible cells for given actor.*/
    this.getVisibleCells = function(actor) {
        var cells = [];
        var xActor = actor.getX();
        var yActor = actor.getY();
        if (actor.isLocated()) {
            if (actor.getLevel().getMap() === this) {
                var range = actor.getFOVRange();
                fov.compute(xActor, yActor, range, function(x, y, r, visibility) {
                    if (visibility) {
                        if (_hasXY(x, y)) {
                            cells.push(map[x][y]);
                        }
                    }
                });
            }
        }
        return cells;
    };

    /** Returns all cells explored by the player.*/
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

    /** Returns true if x,y is located at map border cells.*/
    this.isBorderXY = function(x, y) {
        if (x === 0) return true;
        if (y === 0) return true;
        if (x === this.cols-1) return true;
        if (y === this.rows-1) return true;
        return false;
    };

}; // }}} Map

// }}} MAP GENERATION

/** Factory object for creating some commonly used objects.*/
RG.Factory = function() { // {{{2

    /** Return zero int if given value is null or undef.*/
    var zeroIfNull = function(val) {
        if (!RG.isNullOrUndef[val]) {
            return val;
        }
        return 0;
    };

    var _initCombatant = function(comb, obj) {
        var hp = obj.hp;
        var att = obj.att;
        var def = obj.def;
        var prot = obj.prot;

        if (!RG.isNullOrUndef([hp])) {
            comb.add("Health", new RG.HealthComponent(hp));
        }
        var combatComp = new RG.CombatComponent();

        if (!RG.isNullOrUndef([att])) combatComp.setAttack(att);
        if (!RG.isNullOrUndef([def])) combatComp.setDefense(def);
        if (!RG.isNullOrUndef([prot])) combatComp.setProtection(prot);

        comb.add("Combat", combatComp);
    };

    // Regexp for parsing dice like "3d3 + 2".
    var _dmgRe = /\s*(\d+)d(\d+)\s*(\+|-)?\s*(\d+)?/;

    this.createDie = function(strOrArray) {
        if (typeof strOrArray === "object") {
            if (strOrArray.length >= 3) {
                return new RG.Die(strOrArray[0]. strOrArray[1], strOrArray[2]);
            }
        }
        else {
            var match = _dmgRe.exec(strOrArray);
            if (match !== null) {
                var num = match[1];
                var dType = match[2];
                var mod;
                if (!RG.isNullOrUndef([match[3], match[4]])) {
                    if (match[3] === "+") mod = match[4];
                    else mod = -match[4];
                }
                else {
                    mod = 0;
                }
                return new RG.Die(num, dType, mod);
            }
            else {
                RG.err("DamageObject", "setDamage", "Cannot parse: " + strOrArray);
            }
        }
        return null;
    };

    /** Factory method for players.*/
    this.createPlayer = function(name, obj) {
        var player = new RG.RogueActor(name);
        player.setIsPlayer(true);
        _initCombatant(player, obj);
        return player;
    };

    /** Factory method for monsters.*/
    this.createMonster = function(name, obj) {
        var monster = new RG.RogueActor(name);
        if (RG.isNullOrUndef([obj])) obj = {};

        var brain = obj.brain;
        _initCombatant(monster, obj);
        if (!RG.isNullOrUndef([brain])) {
            if (typeof brain === "object") {
                monster.setBrain(brain);
            }
            else { // If brain is string, use factory to create a new one
                var newBrain = this.createBrain(monster, brain);
                monster.setBrain(newBrain);
            }
        }
        return monster;
    };

    /** Factory method for AI brain creation.*/
    this.createBrain = function(actor, brainName) {
        switch(brainName) {
            case "Animal": return new RG.AnimalBrain(actor);
            case "Demon": return new RG.DemonBrain(actor);
            case "Human": return new RG.HumanBrain(actor);
            case "Summoner": return new RG.SummonerBrain(actor);
            case "Zombie": return new RG.ZombieBrain(actor);
            default: return new RG.RogueBrain(actor);
        }
    };

    this.createFloorCell = function(x, y) {
        var cell = new RG.MapCell(x, y, new RG.RogueElement("floor"));
        return cell;
    };

    this.createWallCell = function(x, y) {
        var cell = new RG.MapCell(x, y, new RG.RogueElement("wall"));
        return cell;
    };

    /** Factory method for creating levels.*/
    this.createLevel = function(levelType, cols, rows, conf) {
        var mapgen = new RG.RogueMapGen();
        mapgen.setGen(levelType, cols, rows);
        var map = mapgen.getMap();
        if (levelType === "town") map = mapgen.createTown(cols, rows, conf);

        var level = new RG.RogueLevel(cols, rows);
        level.setMap(map);
        return level;
    };

    /** Creates a randomized level for the game. Danger level controls how the
     * randomization is done. */
    this.createRandLevel = function(cols, rows, danger) {
        var levelType = RG.RogueMapGen.getRandType();
        var level = this.createLevel(levelType, cols, rows);
    };

    this.createWorld = function(nlevels) {

    };

    /** Player stats based on user selection.*/
    this.playerStats = {
        Weak: {att: 1, def: 1, prot: 1, hp: 15, Weapon: "Dagger"},
        Medium: {att: 2, def: 4, prot: 2, hp: 25, Weapon: "Short sword"},
        Strong: {att: 5, def: 6, prot: 3, hp: 40, Weapon: "Tomahawk"},
        Inhuman: {att: 10, def: 10, prot: 4, hp: 80, Weapon: "Magic sword"},
    },


    /** Return random free cell on a given level.*/
    this.getFreeRandCell = function(level) {
        var freeCells = level.getMap().getFree();
        if (freeCells.length > 0) {
            var maxFree = freeCells.length;
            var randCell = Math.floor(Math.random() * maxFree);
            var cell = freeCells[randCell];
            return cell;
        }
        return null;
    };

    /** Adds N random items to the level based on maximum value.*/
    this.addNRandItems = function(parser, itemsPerLevel, level, maxVal) {
        // Generate the items randomly for this level
        for (var j = 0; j < itemsPerLevel; j++) {
            var item = parser.createRandomItem({
                func: function(item) {return item.value <= maxVal;}
            });
            var itemCell = this.getFreeRandCell(level);
            level.addItem(item, itemCell.getX(), itemCell.getY());
        }
    };

    /** Adds N random monsters to the level based on given danger level.*/
    this.addNRandMonsters = function(parser, monstersPerLevel, level, maxDanger) {
        // Generate the monsters randomly for this level
        for (var i = 0; i < monstersPerLevel; i++) {
            var cell = this.getFreeRandCell(level);
            var monster = parser.createRandomActor({
                func: function(actor){return actor.danger <= maxDanger;}
            });
            monster.get("Experience").setExpLevel(maxDanger);
            level.addActor(monster, cell.getX(), cell.getY());
        }
    };




    this.createHumanArmy = function(level, parser) {
        for (var y = 0; y < 2; y++) {
            for (var x = 0; x < 20; x++) {
                var human = parser.createActualObj("actors", "fighter");
                level.addActor(human, x + 1, 4+y);
            }

            var warlord = parser.createActualObj("actors", "warlord");
            level.addActor(warlord, 10, y + 7);
        }

    };

    this.spawnDemonArmy = function(level, parser) {
        for (var y = 0; y < 2; y++) {
            for (var i = 0; i < 10; i++) {
                var demon = parser.createActualObj("actors", "Winter demon");
                level.addActor(demon, i + 10, 14+y);
            }
        }
    };

    this.spawnBeastArmy = function(level, parser) {
        var x0 = level.getMap().cols / 2;
        var y0 = level.getMap().rows / 2;
        for (var y = y0; y < y0+2; y++) {
            for (var x = x0; x < x0+10; x++) {
                var beast = parser.createActualObj("actors", "Blizzard beast");
                level.addActor(beast, x + 10, 14+y);
            }
        }
    };

};

RG.FACT = new RG.Factory();
// }}}

RG.FCCGame = function() {
    RG.Factory.call(this);

    /** Creates a player actor and starting inventory.*/
    this.createFCCPlayer = function(parser, game, obj) {
        var pLevel = obj.playerLevel;
        var pConf = this.playerStats[pLevel];

        var player = this.createPlayer("Player", {
            att: pConf.att, def: pConf.def, prot: pConf.prot
        });

        player.setType("player");
        player.add("Health", new RG.HealthComponent(pConf.hp));
        var startingWeapon = parser.createActualObj("items", pConf.Weapon);
        player.getInvEq().addItem(startingWeapon);
        player.getInvEq().equipItem(startingWeapon);

        var regenPlayer = new RG.RogueRegenEvent(player, 20 * RG.ACTION_DUR);
        game.addEvent(regenPlayer);
        return player;
    },

    /** Creates the game for the FCC project.*/
    this.createFCCGame = function(obj) {
        var parser = new RG.RogueObjectStubParser();
        parser.parseStubData(RGObjects);
        var cols = obj.cols;
        var rows = obj.rows;
        var nLevels = obj.levels;
        var sqrPerMonster = obj.sqrPerMonster;
        var sqrPerItem = obj.sqrPerItem;

        var game = new RG.RogueGame();
        var player = this.createFCCPlayer(parser, game, obj);

        if (obj.debugMode === "Arena") {
            return this.createFCCDebugGame(obj, parser, game, player);
        }

        var levels = ["rooms", "rogue", "digger", "icey"];
        var maxLevelType = levels.length;

        // For storing stairs and levels
        var allStairsUp   = [];
        var allStairsDown = [];
        var allLevels     = [];

        // Generate all game levels
        for (var nl = 0; nl < nLevels; nl++) {

            var nLevelType = Math.floor(Math.random() * maxLevelType);
            var levelType = levels[nLevelType];
            if (nl === 0) levelType = "ruins";
            var level = this.createLevel(levelType, cols, rows);

            game.addLevel(level);
            if (nl === 0) {
                var hunger = new RG.HungerComponent(2000);
                player.add("Hunger", hunger);
                game.addPlayer(player);
            }

            var numFree = level.getMap().getFree().length;
            var monstersPerLevel = Math.round(numFree / sqrPerMonster);
            var itemsPerLevel = Math.round(numFree / sqrPerItem);

            var potion = new RG.RogueItemPotion("Healing potion");
            level.addItem(potion);
            var missile = parser.createActualObj("items", "Shuriken");
            level.addItem(missile);

            this.addNRandItems(parser, itemsPerLevel, level, 20*(nl +1));
            this.addNRandMonsters(parser, monstersPerLevel, level, nl + 1);

            allLevels.push(level);
        }

        // Create the final boss
        var lastLevel = allLevels.slice(-1)[0];
        var bossCell = this.getFreeRandCell(lastLevel);
        var summoner = this.createMonster("Summoner", {hp: 100, att: 10, def: 10});
        summoner.setType("summoner");
        summoner.get("Experience").setExpLevel(10);
        summoner.setBrain(new RG.SummonerBrain(summoner));
        lastLevel.addActor(summoner, bossCell.getX(), bossCell.getY());

        var extraLevel = this.createLevel("arena", cols, rows);

        // Connect levels with stairs
        for (nl = 0; nl < nLevels; nl++) {
            var src = allLevels[nl];

            var stairCell = null;
            if (nl < nLevels-1) {
                var targetDown = allLevels[nl+1];
                var stairsDown = new RG.RogueStairsElement(true, src, targetDown);
                stairCell = this.getFreeRandCell(src);
                src.addStairs(stairsDown, stairCell.getX(), stairCell.getY());
                allStairsDown.push(stairsDown);
            }
            else {
                var finalStairs = new RG.RogueStairsElement(true, src, extraLevel);
                var stairsLoot = new RG.LootComponent(finalStairs);
                summoner.add("Loot", stairsLoot);
                allStairsDown.push(finalStairs);
            }

            if (nl > 0) {
                var targetUp = allLevels[nl-1];
                var stairsUp = new RG.RogueStairsElement(false, src, targetUp);
                stairCell = this.getFreeRandCell(src);
                src.addStairs(stairsUp, stairCell.getX(), stairCell.getY());
                allStairsUp.push(stairsUp);
            }
            else {
                allStairsUp.push(null);
            }
        }

        var lastStairsDown = allStairsDown.slice(-1)[0];
        var extraStairsUp = new RG.RogueStairsElement(false, extraLevel, lastLevel);
        var rStairCell = this.getFreeRandCell(extraLevel);
        extraLevel.addStairs(extraStairsUp, rStairCell.getX(), rStairCell.getY());
        extraStairsUp.setTargetStairs(lastStairsDown);
        lastStairsDown.setTargetStairs(extraStairsUp);

        // Create NPCs for the extra level
        var humansPerLevel = 2 * monstersPerLevel; 
        for (var i = 0; i < 10; i++) {
            var name = "Townsman";
            var human = this.createMonster(name, {brain: "Human"});
            human.setType("human");
            var cell = this.getFreeRandCell(extraLevel);
            extraLevel.addActor(human, cell.getX(), cell.getY());
        }

        // Finally connect the stairs together
        for (nl = 0; nl < nLevels; nl++) {
            if (nl < nLevels-1)
                allStairsDown[nl].setTargetStairs(allStairsUp[nl+1]);
            if (nl > 0)
                allStairsUp[nl].setTargetStairs(allStairsDown[nl-1]);
        }

        return game;

    };

    /** Can be used to create a short debugging game for testing.*/
    this.createFCCDebugGame = function(obj, parser, game, player) {
        var sqrPerMonster = obj.sqrPerMonster;
        var sqrPerItem = obj.sqrPerItem;
        //var level = this.createLevel("Arena", obj.cols, obj.rows);
        //var level = this.createLevel("town", obj.cols, obj.rows);

        var level = this.createLevel("town", obj.cols, obj.rows, 
            {nHouses: 10, minHouseX: 5, maxHouseX: 10, minHouseY: 5, maxHouseY: 10});

        var numFree = level.getMap().getFree().length;
        var monstersPerLevel = Math.round(numFree / sqrPerMonster);
        var itemsPerLevel = Math.round(numFree / sqrPerItem);

        game.addLevel(level);
        game.addPlayer(player);
        player.setFOVRange(30);

        this.createHumanArmy(level, parser);

        var wolf = this.createMonster("wolf", {brain: "Animal"});
        this.addNRandItems(parser, itemsPerLevel, level, 1000);
        level.addActor(wolf, 6, 6);

        var demonEvent = new RG.RogueOneShotEvent(this.spawnDemonArmy.bind(this,level,
            parser), 100 * 20, "Demon hordes are unleashed from the unsilent abyss!");
        game.addEvent(demonEvent);

        var beastEvent = new RG.RogueOneShotEvent(this.spawnBeastArmy.bind(this,level,
            parser, 100 * 100, "Winter spread by Blizzard Beasts!"));
        game.addEvent(beastEvent);

        //this.addNRandMonsters(parser, monstersPerLevel, level, 10);
        return game;
    };

};
RG.extend2(RG.FCCGame, RG.Factory);

/** Object parser for reading game data. Game data is contained within stubs
 * which are simply object literals without functions etc. */
RG.RogueObjectStubParser = function() {

    var categ = ['actors', 'items', 'levels', 'dungeons'];

    // Stores the base objects
    var _base = {
        actors: {},
        items: {},
        levels: {},
        dungeons: {}
    };

    var _db = {
        actors: {},
        items: {},
        levels: {},
        dungeons: {}
    };

    var _db_danger = {}; // All entries indexed by danger
    var _db_by_name = {}; // All entries indexed by name

    /** Maps obj props to function calls. Essentially this maps bunch of setters
     * to different names. Following formats supported:
     *
     * 1. {factory: funcObj, func: "setter"}
     *  Call obj["setter"]( funcObj(stub.field) )
     *
     * 2. {comp: "CompName", func: "setter"}
     *  Create component comp of type "CompName".
     *  Call comp["setter"]( stub.field)
     *  Call obj.add("CompName", comp)
     *
     * 3. {comp: "CompName"}
     *  Create component comp of type "CompName" with new CompName(stub.field)
     *  Call obj.add("CompName", comp)
     *
     * 4. "setter"
     *   Call setter obj["setter"](stub.field)
     * */
    var _propToCall = {
        actors: {
            type: "setType",
            attack: {comp: "Combat", func: "setAttack"},
            defense: {comp: "Combat", func:"setDefense"},
            damage: {comp: "Combat", func:"setDamage"},
            speed: {comp: "Stats", func: "setSpeed"},
            hp: {comp: "Health"},
            danger: {comp: "Experience", func: "setDanger"},
            brain: {func: "setBrain", factory: RG.FACT.createBrain},
        },
        items: {
            // Generic item functions
            value: "setValue",
            weight: "setWeight",

            armour: {
                attack: "setAttack",
                defense: "setDefense",
                protection: "setProtection",
                armourType: "setArmourType",
            },

            weapon: {
                damage: "setDamage",
                attack: "setAttack",
                defense: "setDefense",
            },
            missile: {
                damage: "setDamage",
                attack: "setAttack",
                range: "setAttackRange",
            },
            food: {
                energy: "setEnergy",
            },
        },
        levels: {},
        dungeons: {}
    };

    //---------------------------------------------------------------------------
    // "PARSING" METHODS
    //---------------------------------------------------------------------------

    /** Parses all stub data, items, monsters, level etc.*/
    this.parseStubData = function(obj) {
        var keys = Object.keys(obj);
        for (var i = 0; i < keys.length; i++) {
            this.parseStubCateg(keys[i], obj[keys[i]]);
        }
    };

    /** Parses one specific stub category, ie items or monsters.*/
    this.parseStubCateg = function(categ, objsArray) {
        for (var i = 0; i < objsArray.length; i++) {
            this.parseObjStub(categ, objsArray[i]);
        }
    };

    /** Parses an object stub. Returns null for base objects, and
     * corresponding object for actual actors.*/
    this.parseObjStub = function(categ, obj) {
        if (this.validStubGiven(obj)) {
            // Get properties from base class
            if (obj.hasOwnProperty("base")) {
                var baseName = obj.base;
                if (this.baseExists(categ, baseName)) {
                    obj = this.extendObj(obj, this.getBase(categ, baseName));
                }
                else {
                    RG.err("ObjectParser", "parseObjStub", 
                        "Unknown base " + baseName + " specified for " + obj);
                }
            }

            if (categ === "actors") this.addTypeIfUntyped(obj);

            this.storeIntoDb(categ, obj);
            return obj;
        }
        else {
            return null;
        }
    };

    /** Checks that the object stub given is correctly formed.*/
    this.validStubGiven = function(obj) {
        if (!obj.hasOwnProperty("name")) {
            RG.err("ObjectStubParser", "validStubGiven",
                "Stub doesn't have a name.");
            return false;
        }
        //console.log("validStub ==> " + obj.name);
        return true;
    };

    /** If an object doesn't have type, the name is chosen as its type.*/
    this.addTypeIfUntyped = function(obj) {
        if (!obj.hasOwnProperty("type")) {
            obj.type = obj.name;
        }
    };

    /** Returns an object stub given category and name.*/
    this.get = function(categ, name) {
        return _db[categ][name];
    };

    /** Return specified base stub.*/
    this.getBase = function(categ, name) {
        return _base[categ][name];
    };

    this.setAsBase = function(categ, obj) {
        _base[categ][obj.name] = obj;
    };

    /** Stores the object into given category.*/
    this.storeIntoDb = function(categ, obj) {
        if (_db.hasOwnProperty(categ)) {
            this.setAsBase(categ, obj);

            if (!obj.hasOwnProperty("dontCreate")) {
                _db[categ][obj.name] = obj;
                if (_db_by_name.hasOwnProperty(obj.name)) {
                    _db_by_name[obj.name].push(obj);
                }
                else {
                    var newArr = [];
                    newArr.push(obj);
                    _db_by_name[obj.name] = newArr;
                }
                if (obj.hasOwnProperty("danger")) {
                    var danger = obj.danger;
                    if (!_db_danger.hasOwnProperty(danger)) {
                        _db_danger[danger] = {};
                    }
                    if (!_db_danger[danger].hasOwnProperty(categ)) {
                        _db_danger[danger][categ] = {};
                    }
                    _db_danger[danger][categ][obj.name] = obj;
                }
            } // dontCreate
        }
        else {
            RG.err("ObjectParser", "storeIntoDb",
                "Unknown category: " + categ);
        }
        this.storeRenderingInfo(categ, obj);
    };

    /** Stores char/CSS className for the object for rendering purposes.*/
    this.storeRenderingInfo = function(categ, obj) {
        //console.log("\tStoring render information for " + obj.name);
        if (obj.hasOwnProperty("char")) {
            if (obj.hasOwnProperty("name")) {
                RG.addCharStyle(categ, obj.name, obj["char"]);
            }
            else {
                RG.addCharStyle(categ, obj.type, obj["char"]);
            }
        }
        if (obj.hasOwnProperty("className")) {
            if (obj.hasOwnProperty("name")) {
                RG.addCellStyle(categ, obj.name, obj.className);
            }
            else {
                RG.addCellStyle(categ, obj.type, obj.className);
            }
        }
    };

    /** Creates a component of specified type.*/
    this.createComponent = function(type, val) {
        switch(type) {
            case "Combat": return new RG.CombatComponent();
            case "Health": return new RG.HealthComponent(val);
            case "Stats": return new RG.StatsComponent();
            default: RG.err("ObjectParser", "createComponent",
                "Unknown component " + type + " for the factory method.");
        }
    };

    /** Returns an actual game object when given category and name. Note that
     * the blueprint must exist already in the database (blueprints must have
     * been parser before). */
    this.createActualObj = function(categ, name) {
        if (!this.dbExists(categ, name)) {
            RG.err("ObjectParser", "createActualObj",
                "Categ: " + categ + " Name: " + name + " doesn't exist.");
            return null;
        }

        var stub = this.get(categ, name);
        var propCalls = _propToCall[categ];
        var newObj = this.createNewObject(categ, stub);

        // If propToCall table has the same key as stub property, call corresponding
        // function in _propToCall using the newly created object.
        for (var p in stub) {

            // Called for basic type: actors, items...
            if (propCalls.hasOwnProperty(p)) {
                var funcName = propCalls[p];
                if (typeof funcName === "object") {
                    if (funcName.hasOwnProperty("comp")) {
                        this.addCompToObj(newObj, funcName, stub[p]);
                    }
                    else if (funcName.hasOwnProperty("factory")) {
                        if (p === "brain") {
                            var createdObj = funcName.factory(newObj, stub[p]);
                            //console.log("Creatin brain: " + stub[p]);
                            newObj[funcName.func](createdObj);
                        }
                    }
                    else {
                        for (var f in funcName) {
                            var fName = funcName[f];
                            if (newObj.hasOwnProperty(fName)) {
                                newObj[fName](stub[p]);
                            }
                        }
                    }
                }
                else {
                    newObj[funcName](stub[p]);
                }
            }
            else { // Check for subtypes
                if (stub.hasOwnProperty("type")) {
                    if (propCalls.hasOwnProperty(stub.type)) {
                        var propTypeCalls = propCalls[stub.type];
                        if (propTypeCalls.hasOwnProperty(p)) {
                            var funcName2 = propTypeCalls[p];
                            if (typeof funcName2 === "object") {
                                for (var f2 in funcName2) {
                                    var fName2 = funcName2[f2];
                                    if (newObj.hasOwnProperty(fName)) {
                                        newObj[funcName2[f2]](stub[p]);
                                    }
                                }
                            }
                            else {
                                newObj[funcName2](stub[p]);
                            }
                        }
                    }
                }
            }
        }

        // TODO map different props to function calls
        return newObj;
    };

    /** Adds a component to the newly created object, or updates existing
     * component if it exists already.*/
    this.addCompToObj = function(newObj, compData, val) {
        if (compData.hasOwnProperty("func")) {
            var fname = compData.func;
            var compName = compData.comp;
            if (newObj.has(compName)) {
                newObj.get(compName)[fname](val);
            }
            else { // Have to create new component
                var comp = this.createComponent(compName);
                comp[fname](val);
            }
        }
        else {
            newObj.add(compData.comp, 
                this.createComponent(compData.comp, val));
        }

    };

    this.createFromStub = function(categ, obj) {
        return this.createActualObj(categ, obj.name);
    };

    /** Factory-method for creating the actual objects.*/
    this.createNewObject = function(categ, obj) {
        switch(categ) {
            case "actors": return new RG.RogueActor(obj.name);
            case RG.TYPE_ITEM:
                var subtype = obj.type;
                switch(subtype) {
                    case "armour": return new RG.RogueItemArmour(obj.name);
                    case "weapon": return new RG.RogueItemWeapon(obj.name);
                    case "food": return new RG.RogueItemFood(obj.name);
                    case "missile": return new RG.RogueItemMissile(obj.name);
                    case "tool": break;
                }
                return new RG.RogueItem(obj.name); // generic, useless
                break;
            case "levels":
                return RG.FACT.createLevel(obj.type, obj.cols, obj.rows);
            case "dungeons": break;
            default: break;
        }
        return null;
    };

    /** Returns true if base exists.*/
    this.baseExists = function(categ, baseName) {
        if (_base.hasOwnProperty(categ)) {
            return _base[categ].hasOwnProperty(baseName);
        }
        return false;

    };

    /** Extends the given object stub with given base object.*/
    this.extendObj = function(obj, baseObj) {
        for (var prop in baseObj) {
            if (!obj.hasOwnProperty(prop)) {
                if (prop !== "dontCreate") {
                    //console.log("\textendObj: Added " + prop + " to " + obj.name);
                    obj[prop] = baseObj[prop];
                }
            }
        }
        return obj;
    };

    //---------------------------------------------------------------------------
    // Database get-methods
    //---------------------------------------------------------------------------

    this.dbExists = function(categ, name) {
        if (_db.hasOwnProperty(categ)) {
            if (_db[categ].hasOwnProperty(name)) return true;
        }
        return false;
    };

    /** Returns entries from db based on the query. Returns null if nothing
     * matches.*/
    this.dbGet = function(query) {

        var name   = query.name;
        var categ  = query.categ;
        var danger = query.danger;
        var type   = query.type;

        // Specifying name returns an array
        if (typeof name !== "undefined") {
            if (_db_by_name.hasOwnProperty(name))
                return _db_by_name[name];
            else
                return [];
        }

        if (typeof danger !== "undefined") {
            if (_db_danger.hasOwnProperty(danger)) {
                var entries = _db_danger[danger];
                if (typeof categ !== "undefined") {
                    if (entries.hasOwnProperty(categ)) {
                        return entries[categ];
                    }
                    else return {};
                }
                else {
                    return _db_danger[danger];
                }
            }
            else {
                return {};
            }
        }
        else { // Fetch all entries of given category
            if (typeof categ !== "undefined") {
                if (_db.hasOwnProperty(categ)) {
                    return _db[categ];
                }
            }
        }
        return {};

    };

    //---------------------------------------------------------------------------
    // RANDOMIZED METHODS for procedural generation
    //---------------------------------------------------------------------------

    /** Returns stuff randomly from db. For example, {categ: "actors", num: 2}
     * returns two random actors (can be the same). Ex2: {danger: 3, num:1}
     * returns randomly one entry which has danger 3.*/
    this.dbGetRand = function(query) {
        var danger = query.danger;
        var categ  = query.categ;
        if (typeof danger !== "undefined") {
            if (typeof categ !== "undefined") {
                var entries = _db_danger[danger][categ];
                return this.getRandFromObj(entries);
            }
        }
        return null;
    };

    /** Returns a property from object selected randomly.*/
    this.getRandFromObj = function(obj) {
        var keys = Object.keys(obj);
        var len = keys.length;
        var randIndex = Math.floor( Math.random() * len);
        return obj[keys[randIndex]];
    };

    this.filterCategWithFunc = function(categ, func) {
        var objects = this.dbGet({categ: categ});
        var res = [];
        var keys = Object.keys(objects);

        for (var i = 0; i < keys.length; i++) {
            var name = keys[i];
            var obj = objects[name];
            var acceptItem = func(obj);
            if (acceptItem) {
                res.push(obj);
            }
        }
        return res;

    };

    /** Creates a random actor based on danger value.*/
    this.createRandomActor = function(obj) {
        if (obj.hasOwnProperty("danger")) {
            var danger = obj.danger;
            var randObj = this.dbGetRand({danger: danger, categ: "actors"});
            if (randObj !== null) {
                return this.createFromStub("actors", randObj);
            }
            else {
                return null;
            }
        }
        else if (obj.hasOwnProperty("func")) {
            var res = this.filterCategWithFunc("actors", obj.func);
            var randObj = this.arrayGetRand(res);
            return this.createFromStub("actors", randObj);
        }
    };

    /** Creates a random item based on selection functions.*/
    this.createRandomItem = function(obj) {
        if (obj.hasOwnProperty("func")) {
            var res = this.filterCategWithFunc("items", obj.func);
            var randObj = this.arrayGetRand(res);
            return this.createFromStub("items", randObj);
        }
        else {
            RG.err("ObjectParser", "createRandomItem", "No function given.");
        }
    };

    /** Returns a random entry from the array.*/
    this.arrayGetRand = function(arr) {
        var len = arr.length;
        var randIndex = Math.floor(Math.random() * len);
        return arr[randIndex];
    };

};

/** Object database with commands to retrieve random variables.*/
RG.RogueObjectDatabase = function(obj) {

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
