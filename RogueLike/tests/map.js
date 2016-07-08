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

var getClass = RG.getStyleClassForCell;

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
    });
});


describe('Retrieving styling classes for cells', function() {
    it('description', function() {
        var cell = new Cell(0, 0, new Element("wall"));
        expect(RG.getStyleClassForCell(cell)).to.equal("cell-element-wall");

        var floorCell = new Cell(0, 0, new Element("floor"));
        var actor = new Actor(true);
        floorCell.setProp("actors", actor);
        expect(RG.getStyleClassForCell(floorCell)).to.equal("cell-actors");
    });
});
