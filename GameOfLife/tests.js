
var chai = require("chai");
var expect = chai.expect;

var GameOfLife = require("./gameoflife");

describe('GameOfLife', function() {
    it('Basic sanity tests', function() {
        var game = new GameOfLife(12, 10);
        expect(game.cols).to.equal(12);
        expect(game.rows).to.equal(10);
        expect(game.board.length).to.equal(120);

        game.setXY(0, 0, true);
        expect(game.getXY(0,0)).to.equal(true);
        expect(game.getXY(1,1)).to.equal(false);

        expect(game.getX(119)).to.equal(11);
        expect(game.getY(119)).to.equal(9);

    });

    it('Coordinate functions', function() {
        var game = new GameOfLife(3, 5);

        // First we test all corners
        expect(game.getAdjacent(0).length).to.equal(3);
        expect(game.getAdjacent(2).length).to.equal(3);
        expect(game.getAdjacent(12).length).to.equal(3);
        expect(game.getAdjacent(14).length).to.equal(3);

        // Then some other locations
        expect(game.getAdjacent(4).length).to.equal(8);
        expect(game.getAdjacent(3).length).to.equal(5);
        expect(game.getAdjacent(13).length).to.equal(5);

        game.setXY(1,1, true);
        expect(game.getAdjacentAlive(0)).to.equal(1);
        game.setXY(1,0, true);
        expect(game.getAdjacentAlive(0)).to.equal(2);
        game.setXY(1,3, true);
        expect(game.getAdjacentAlive(7)).to.equal(2);
    });


    it('Next state logic', function() {
        var game = new GameOfLife(4, 4);

        // One cell dies
        game.setXY(0, 0, true);
        game.nextState();
        expect(game.getXY(0,0)).to.equal(false);


        // 2x2 pattern stays forever
        game.setXY(0, 0, true);
        game.setXY(0, 1, true);
        game.setXY(1, 0, true);
        game.setXY(1, 1, true);
        game.nextState();
        expect(game.getXY(0, 0)).to.equal(true);
        expect(game.getXY(0, 2)).to.equal(false);
        for (var i = 0; i < 10; i++) {
            game.nextState();
        }
        expect(game.getXY(0, 0)).to.equal(true);
        expect(game.getXY(0, 2)).to.equal(false);

        // 3 adjacent cells spawn a new one
        var game2 = new GameOfLife(4, 4);
        expect(game2.getXY(1, 1)).to.equal(false);
        game2.setXY(0, 0, true);
        game2.setXY(1, 0, true);
        game2.setXY(2, 0, true);
        game2.nextState();
        expect(game2.getXY(1, 1)).to.equal(true);
        game2.nextState();
        expect(game2.getXY(1, 1)).to.equal(false);

        // A simple 3 cell oscillator
        var gameOsc = new GameOfLife(4, 4);
        gameOsc.setXY(0, 1, true);
        gameOsc.setXY(1, 1, true);
        gameOsc.setXY(2, 1, true);
        gameOsc.nextState();
        expect(gameOsc.getXY(1, 1)).to.equal(true);
        gameOsc.nextState();
        expect(gameOsc.getXY(0, 1)).to.equal(true);
        expect(gameOsc.getXY(1, 1)).to.equal(true);
        expect(gameOsc.getXY(2, 1)).to.equal(true);


    });

    it('Row logic', function() {
        var game = new GameOfLife(12, 10);
        expect(game.getRow(0).length).to.equal(12);

    });


});
