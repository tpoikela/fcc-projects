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

describe('How game should proceed', function() {
    it('Initializes the game and adds player', function() {
        var mapGen = new RG.RogueMapGen();
        var level = new RG.RogueLevel(30, 50);

        var cols = 50;
        var rows = 30;
        mapGen.setGen("arena", cols, rows);
        var map = mapGen.getMap();
        level.setMap(map);

        var actor = new Actor(true); // player
        game.addLevel(level);
        expect(game.addPlayer(actor)).to.equal(true);

        expect(game.shownLevel()).to.equal(level);
        expect(actor.getLevel()).to.equal(level);

        expect(level.moveActorTo(actor, 10, 12)).to.equal(true);

    });
});

