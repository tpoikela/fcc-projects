/**
 * Unit tests for checking that a full game works. It's tedious to repeat very
 * long sequence with GUI, but this module makes sure that basics are working.
 */

var chai = require("chai");
var expect = chai.expect;
var RG = require("../roguelike.js");

var RGTest = require("./roguetest.js");

var checkXY = RGTest.checkActorXY;

var Game = RG.RogueGame;
var Actor = RG.RogueActor;

// Takes turns instead of real-player
var SurrogatePlayer = function() {

};

var game = new Game();

function checkMap(map, cols, rows) {
    for (var x = 0; x < cols; x++) {
        for (var y = 0; y < rows; y++) {
            //console.log("x :: " + x);
            expect(typeof map.getCell(x,y)).not.to.equal("undefined");
        }
    }
}

function getNewLevel(cols, rows) {
    var level = new RG.RogueLevel(cols, rows);
    var mapGen = new RG.RogueMapGen();
    mapGen.setGen("arena", cols, rows);
    var map = mapGen.getMap();
    level.setMap(map);
    return level;

}

/** Returns a level with initialized with given actors.*/
function getLevelWithNActors(cols, rows, nactors) {
    var level = getNewLevel(cols, rows);
    var actors = [];
    for (var i = 0; i < nactors; i++) {
        var actor = new Actor(false);
        actors.push(actor);
        level.addActorToFreeCell(actor);
    }
    return [level, actors];
}

describe('How game should proceed', function() {
    it('Initializes the game and adds player', function() {
        var cols = 50;
        var rows = 30;
        var level = getNewLevel(cols, rows);

        //checkMap(map, cols, rows);

        var actor = new Actor("Player"); // player
        actor.setIsPlayer(true);
        actor.setFOVRange(5);
        game.addLevel(level);
        expect(game.addPlayer(actor)).to.equal(true);

        expect(game.shownLevel()).to.equal(level);
        expect(actor.getLevel()).to.equal(level);

        var newMap = level.getMap();
        checkMap(newMap, cols, rows);

        expect(level.moveActorTo(actor, 10, 12)).to.equal(true);

        var explCells = level.exploreCells(actor);
        expect(explCells.length).to.equal(11*11);

        //expect(level.moveActorTo(actor, 11, 13)).to.equal(true);

    });
});

/** For listening actor killed events.*/
var KillListener = function(actor) {

    var _actor = actor;

    this.isAlive = actor.isAlive();

    this.notify = function(evtName, obj) {
        if (evtName === RG.EVT_ACTOR_KILLED) {
            if (obj.actor === _actor) {
                this.isAlive = false;
            }
        }
    };
    RG.POOL.listenEvent(RG.EVT_ACTOR_KILLED, this);
};

describe('How combat should evolve', function() {
    it('Deals damage from attacker to defender', function() {
        var cols = 50;
        var rows = 30;
        var level = getNewLevel(cols, rows);

        var attacker = new Actor("Attacker");
        expect(attacker.isAlive()).to.equal(true);
        var defender = new Actor("Defender");
        expect(defender.isAlive()).to.equal(true);
        attacker.setAttack(10);
        defender.setHP(1);
        defender.setDefense(0);
        defender.setAgility(0);

        level.addActor(attacker, 1, 1);
        level.addActor(defender, 2, 2);

        var combat = new RG.RogueCombat(attacker, defender);
        combat.fight();
        expect(defender.isAlive()).to.equal(false);

        var def2 = new Actor(false);
        level.addActor(def2, 2, 2);
        combat = new RG.RogueCombat(attacker, def2);
        def2.setHP(20);
        def2.setDefense(0);
        def2.setAgility(0);
        expect(def2.isAlive()).to.equal(true);
        combat.fight();

        expect(def2.getHP() < 20).to.equal(true);

        //expect(def2.getHP()).to.equal(20 - (10-2));
        expect(def2.isAlive()).to.equal(true);
        combat.fight();
        expect(def2.isAlive()).to.equal(true);

        var killListen = new KillListener(def2);
        while (killListen.isAlive) {
            combat.fight();
        }
        expect(def2.isAlive()).to.equal(false);

    });
});

describe('How AI brain works', function() {
    var cols = 30;
    var rows = 20;
    var level = getNewLevel(cols, rows);
    var mons1 = new Actor("Monster");
    var player = new Actor("Player");
    player.setIsPlayer(true);

    it('Brain should find player cell', function() {
        expect(level.addActor(player, 2, 2)).to.equal(true);
        expect(level.addActor(mons1, 3, 5)).to.equal(true);

        var map = level.getMap();
        expect(map.isPassable(2,3)).to.equal(true);

        var brain = new RG.RogueBrain(mons1);
        var seenCells = level.getMap().getVisibleCells(mons1);
        expect(seenCells.length).to.not.equal(0);
        var playerCell = brain.findEnemyCell(seenCells);
        expect(playerCell.hasProp("actors")).to.equal(true);

        var pathCells = brain.getShortestPathTo(playerCell);
        expect(pathCells).to.be.a('array');
        expect(pathCells.length).to.not.equal(0);
    });

    it('description', function() {
        expect(level.addActor(player, 2, 2)).to.equal(true);
        expect(level.addActor(mons1, 2, 4)).to.equal(true);
        var action = mons1.nextAction();
        action.doAction();
        checkXY(mons1, 2, 3);

    });

});

var ItemDestroyer = function() {

    this.notify = function(evtName, obj) {
        if (evtName === RG.EVT_DESTROY_ITEM) {
            var item = obj.item;
            var owner = item.getOwner().getOwner();
            owner.getInvEq().removeItem(item);
            console.log("Removed the item " + item.getName());
        }
    };
    RG.POOL.listenEvent(RG.EVT_DESTROY_ITEM, this);
};

describe('How one-shot items are removed after their use', function() {
    it('Player uses a potion and it is destroyed after this.', function() {
        var potion = new RG.RogueItemPotion("potion");
        var player = new Actor("Player");
        var invEq = player.getInvEq();
        var itemDestroy = new ItemDestroyer();
        invEq.addItem(potion);

        // Do some damage
        var hp = player.getHP();
        player.setHP(hp - 5);
        var currHP = player.getHP();

        expect(invEq.hasItem(potion)).to.equal(true);
        expect(player.getInvEq().useItem(potion, {target: player})).to.equal(true);
        expect(player.getHP() != currHP).to.equal(true);
        expect(invEq.hasItem(potion)).to.equal(false);

    });
});
