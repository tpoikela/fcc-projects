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

describe('How game should proceed', function() {
    it('Initializes the game and adds player', function() {
        var mapGen = new RG.RogueMapGen();
        var cols = 50;
        var rows = 30;

        var level = new RG.RogueLevel(cols, rows);

        mapGen.setGen("arena", cols, rows);
        var map = mapGen.getMap();
        checkMap(map, cols, rows);
        level.setMap(map);

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

