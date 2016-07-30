

var RG = require("../roguelike.js");
var Obs = require("../rogueobjects");

var chai = require("chai");
var expect = chai.expect;

var Parser = RG.RogueObjectParser;
var Db = RG.RogueObjectDatabase;
var Actor = RG.RogueActor;

//---------------------------------------------------------------------------
// PARSER TESTS
//---------------------------------------------------------------------------

describe('How monsters are created from file', function() {
    var parser = new Parser();
    it('Returns base objects and supports also base', function() {
        var wolfNew = parser.parseObj("monsters", {
            name: "wolf", attack: 15, defense: 10, damage: "1d6",
        });
        expect(wolfNew.getAttack()).to.equal(15);
        expect(wolfNew.getDefense()).to.equal(10);

        var superWolf = parser.parseObj("monsters", {
            name: "superwolf", base: "wolf", defense: 20, 
            damage: "2d6 + 3",
        });
        expect(superWolf.getAttack()).to.equal(15);
        expect(superWolf.getDefense()).to.equal(20);

        console.log(superWolf.toString());

    });
});

describe('How items are created from objects', function() {
   var parser = new Parser();
    it('description', function() {
        var food = parser.parseObj("items", {type: "food", name: "Dried meat",
            energy: 100, value: 5
        });
        expect(food.getName()).to.equal("Dried meat");
        expect(food.getEnergy()).to.equal(100);
        expect(food.getValue()).to.equal(5);
        expect(food.getItemType()).to.equal("food");
        expect(food.getType()).to.equal("items");

        var baseFood = {name: "foodBase", dontCreate: true, energy: 100};
    });
});

//---------------------------------------------------------------------------
// DATABASE TESTS
//---------------------------------------------------------------------------
