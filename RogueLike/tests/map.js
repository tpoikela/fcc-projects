/**
 * Unit Tests for maps and map cells.
 *
 */

var chai = require("chai");
var expect = chai.expect;
var RG = require("../roguelike.js");

var Actor = RG.RogueActor;
var Action = RG.RogueAction;
var Level = RG.RogueLevel;
var Element = RG.RogueElement;
var Cell = RG.MapCell;
var Item = RG.RogueItem;

//---------------------------------------------------------------------------
// MAP CELL
//---------------------------------------------------------------------------

describe('Basic properties of map cell', function() {
    it('Holds elements and actors', function() {
        var actor = new Actor(true);
        var cell = new Cell(0, 0, new Element("wall"));
        expect(cell.isFree()).to.equal(false);
        expect(cell.hasPropType("wall")).to.equal(true);
        expect(cell.hasPropType("actors")).to.equal(false);
        expect(cell.lightPasses()).to.equal(false);

        // Setting an element property of the cell
        var floorElem = new Element("floor");
        cell.setProp("elements", floorElem);
        expect(cell.hasPropType("floor")).to.equal(true);
        expect(cell.hasProp("elements")).to.equal(true);

        // Removing a property
        expect(cell.removeProp("elements", floorElem)).to.equal(true);
        expect(cell.hasPropType("floor")).to.equal(false);
        expect(cell.hasProp("elements")).to.equal(false);

        // Retrieving a property
        var propNull = cell.getProp("xxx");
        expect(propNull).to.equal(null);

        // Actors in cell, cell with actor is not free
        var floor = new Element("floor");
        var fCell = new Cell(1, 1, floor);
        expect(fCell.isFree()).to.equal(true);
        fCell.setProp("actors", actor);
        expect(fCell.isFree()).to.equal(false);
        expect(fCell.lightPasses()).to.equal(true);
        expect(fCell.hasProp("actors")).to.equal(true);
        expect(fCell.hasProp("items")).to.equal(false);
    });
});

describe('Retrieving styling classes for cells', function() {
    it('description', function() {
        var cell = new Cell(0, 0, new Element("wall"));
        cell.setExplored();
        expect(RG.getStyleClassForCell(cell)).to.equal("cell-element-wall");

        var floorCell = new Cell(0, 0, new Element("floor"));
        var actor = new Actor(true);
        floorCell.setProp("actors", actor);
        floorCell.setExplored();
        expect(RG.getStyleClassForCell(floorCell)).to.equal("cell-actors");
    });
});

describe('Items in map cells', function() {
    it('description', function() {
        var cell = new Cell(0, 0, new Element("floor"));
        cell.setExplored();
        var item = new Item("food");
        cell.setProp("items", item);
        expect(cell.hasProp("items")).to.equal(true);

        var items = cell.getProp("items");
        expect(items.length).to.equal(1);

        expect(RG.getStyleClassForCell(cell)).to.equal("cell-items");

    });
});

//---------------------------------------------------------------------------
// MAP UNIT TESTS
//---------------------------------------------------------------------------

describe('Tests to check that basic operations for map work', function() {
    var mapgen = new RG.RogueMapGen();
    mapgen.setGen("arena", 10, 10);
    var actor = new Actor(true);
    var level1 = new Level(10, 10);
    var level2 = new Level(20, 20);

    it('Is initialized as empty and having floors', function() {
        var map = mapgen.getMap();
        var map2 = mapgen.getMap();
        level1.setMap(map);
        level2.setMap(map);

        expect(map.hasXY(0,0)).to.equal(true);
        expect(map.hasXY(9,9)).to.equal(true);
        expect(map.hasXY(10,10)).to.equal(false);

        var freeCells = map.getFree();
        expect(freeCells.length).to.equal(8*8);
        for (var i = 0; i < freeCells.length; i++) {
            expect(freeCells[i].isFree()).to.equal(true);
            expect(freeCells[i].lightPasses()).to.equal(true);
        }

        var actorNotInLevel = new Actor(false);
        actor.getFOVRange = function() {return 1;}; // Override default
        level1.addActor(actor, 4, 4);
        var cells = map.getVisibleCells(actor);
        expect(cells.length).to.equal(9);
        var zeroCells = map.getVisibleCells(actorNotInLevel);
        expect(zeroCells.length).to.equal(0);

        // After setting x,y try again
        actorNotInLevel.setXY(4,4);
        actorNotInLevel.getFOVRange = function() {return 5;}; // Override default
        zeroCells = map.getVisibleCells(actorNotInLevel);
        expect(zeroCells.length).to.equal(0);

        expect(level1.getMap().getCell(4,4).isExplored()).to.equal(false);
        level1.exploreCells(actor);
        expect(level1.getMap().getCell(4,4).isExplored()).to.equal(true);

    });
});

//---------------------------------------------------------------------------
// LEVEL UNIT TESTS
//---------------------------------------------------------------------------

describe('Moving actors around in the game', function() {
    it('Moves but is blocked by walls.', function() {
        var actor = new Actor(true);
        var level = new Level(10, 10);
        var mapgen = new RG.RogueMapGen();
        mapgen.setGen("arena", 10, 10);
        var map = mapgen.getMap();
        level.setMap(map);
        level.addActor(actor, 1, 2);
        expect(actor.getX()).to.equal(1);
        expect(actor.getY()).to.equal(2);

        // Actors x,y changes due to move
        expect(level.moveActorTo(actor, 2, 3)).to.equal(true);
        expect(actor.getX()).to.equal(2);
        expect(actor.getY()).to.equal(3);

        // Create a wall to block the passage
        var wall = new Element("wall");
        level.getMap().setBaseElemXY(4, 4, wall);
        expect(level.moveActorTo(actor, 4, 4)).to.equal(false);
        expect(actor.getX(), "X didn't change due to wall").to.equal(2);
        expect(actor.getY()).to.equal(3);

    });
});

