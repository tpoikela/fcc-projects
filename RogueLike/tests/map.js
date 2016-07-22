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
var Container = RG.RogueItemContainer;
var InvAndEquip = RG.RogueInvAndEquip;
var Factory = RG.FACT;

//---------------------------------------------------------------------------
// MAP CELL
//---------------------------------------------------------------------------

describe('Basic properties of map cell', function() {
    it('Holds elements and actors', function() {
        var actor = Factory.createPlayer("Player", 50);
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
        var fCell = Factory.createFloorCell(1, 1);
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
        var actor = Factory.createPlayer("Player", 50);
        floorCell.setProp("actors", actor);
        floorCell.setExplored();
        expect(RG.getStyleClassForCell(floorCell)).to.equal("cell-actors");
    });
});

//---------------------------------------------------------------------------
// ITEMS AND MAP CELLS
//--------------------------------------------------------------------------

describe('Items in map cells', function() {
    it('Is placed in a cell and needs an owner', function() {
        var cell = new Cell(0, 1, new Element("floor"));
        cell.setExplored();
        var item = new Item("food");
        cell.setProp("items", item);
        expect(cell.hasProp("items")).to.equal(true);

        var items = cell.getProp("items");
        expect(items.length).to.equal(1);

        expect(RG.getStyleClassForCell(cell)).to.equal("cell-items");

        // Item must have its owners x,y
        item.setOwner(cell);
        expect(item.getX()).to.equal(0);
        expect(item.getY()).to.equal(1);

    });

    it('Container can also be placed into the cell', function() {
        var cell = new Cell(1, 2, new Element("floor"));
        cell.setExplored();
        var container = new Container(cell);
        expect(container.getX()).to.equal(1);
        expect(container.getY()).to.equal(2);
        expect(container.isEmpty()).to.equal(true);
        expect(container.first()).to.equal(null);
        expect(container.next()).to.equal(null);

        // Test adding items.
        var food = new Item("food");
        var weapon = new Item("weapon");
        expect(food.getOwner()).to.equal(null);
        container.addItem(food);
        expect(food.getOwner()).to.equal(container);
        expect(container.isEmpty()).to.equal(false);
        expect(container.hasItem(food)).to.equal(true);
        expect(container.hasItem(weapon)).to.equal(false);
        expect(container.first()).to.equal(food);
        expect(container.next()).to.equal(null);

        // Add new weapon, then remove food
        container.addItem(weapon);
        expect(container.first()).to.equal(food);
        expect(container.next()).to.equal(weapon);

        expect(container.removeItem(food)).to.equal(true);
        expect(container.first()).to.equal(weapon);
        expect(container.removeItem(food)).to.equal(false);

        var cont2 = new Container(container);
        container.addItem(cont2);
        expect(cont2.getX()).to.equal(1);
        expect(cont2.getY()).to.equal(2);

    });

    it("Actor inventory has a container and equipped items", function() {
        var food = new Item("food");
        var sword = new Item("weapon");
        var actor = Factory.createPlayer("Player", 50);

        var invEq = new InvAndEquip(actor);
        invEq.addItem(food);
        expect(invEq.getInventory().getItems().length).to.equal(1);
        invEq.addItem(sword);
        expect(invEq.getInventory().getItems().length).to.equal(2);
        expect(invEq.equipItem(sword)).to.equal(true);
        expect(invEq.getInventory().getItems().length).to.equal(1);

        var handsEquipped = invEq.getEquipment().getEquipped("hand");
        expect(handsEquipped[0]).to.equal(sword);
        expect(invEq.unequipItem("hand", 0)).to.equal(true);

    });

});



//---------------------------------------------------------------------------
// MAP UNIT TESTS
//---------------------------------------------------------------------------

describe('Tests to check that basic operations for map work', function() {
    var actor = new Actor("Player");
    actor.setIsPlayer(true);
    var level1 = Factory.createLevel("arena", 10, 10);
    var level2 = Factory.createLevel("arena", 20, 20);

    it('Is initialized as empty and having floors', function() {
        var map = level1.getMap();
        var map2 = level2.getMap();

        expect(map.hasXY(0,0)).to.equal(true);
        expect(map.hasXY(9,9)).to.equal(true);
        expect(map.hasXY(10,10)).to.equal(false);

        var freeCells = map.getFree();
        expect(freeCells.length).to.equal(8*8);
        for (var i = 0; i < freeCells.length; i++) {
            expect(freeCells[i].isFree()).to.equal(true);
            expect(freeCells[i].lightPasses()).to.equal(true);
        }

        var actorNotInLevel = new Actor("monster");
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

