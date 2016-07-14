/**
 * Unit tests for checking that a full game works. It's tedious to repeat very
 * long sequence with GUI, but this module makes sure that basics are working.
 */

var chai = require("chai");
var expect = chai.expect;
var RG = require("../roguelike.js");

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

describe('How game should proceed', function() {
    it('Initializes the game and adds player', function() {
        var cols = 50;
        var rows = 30;
        var level = getNewLevel(cols, rows);

        //checkMap(map, cols, rows);

        var actor = new Actor(true); // player
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

describe('How combat should evolve', function() {
    it('Deals damage from attacker to defender', function() {
        var cols = 50;
        var rows = 30;
        var level = getNewLevel(cols, rows);

        var attacker = new Actor(false);
        expect(attacker.isAlive()).to.equal(true);
        var defender = new Actor(false);
        expect(defender.isAlive()).to.equal(true);
        attacker.setAttack(10);
        defender.setHP(5);
        defender.setDefense(5);

        level.addActor(attacker, 1, 1);
        level.addActor(defender, 2, 2);

        var combat = new RG.RogueCombat(attacker, defender);
        combat.fight();
        expect(defender.isAlive()).to.equal(false);

        var def2 = new Actor(false);
        level.addActor(def2, 2, 2);
        combat = new RG.RogueCombat(attacker, def2);
        def2.setHP(20);
        def2.setDefense(2);
        expect(def2.isAlive()).to.equal(true);
        combat.fight();
        expect(def2.getHP()).to.equal(20 - (10-2));
        expect(def2.isAlive()).to.equal(true);
        combat.fight();
        expect(def2.isAlive()).to.equal(true);
        combat.fight();
        expect(def2.isAlive()).to.equal(false);

    });
});

