

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

describe('How actors are created from file', function() {
    var parser = new Parser();
    it('Returns base objects and supports also base', function() {
        var wolfNew = parser.parseObj("actors", {
            name: "wolf", attack: 15, defense: 10, damage: "1d6 + 2",
        });
        expect(wolfNew.attack).to.equal(15);
        expect(wolfNew.defense).to.equal(10);

        var wolves = parser.dbGet({categ: "actors", danger: 3});
        expect(wolves.hasOwnProperty("superwolf")).to.equal(false);

        var superWolf = parser.parseObj("actors", {
            name: "superwolf", base: "wolf", defense: 20, 
            damage: "2d6 + 3", danger: 3
        });
        expect(superWolf.attack).to.equal(15);
        expect(superWolf.defense).to.equal(20);

        var objWolf = parser.dbGet({name: "wolf"})[0];
        expect(objWolf).to.equal(wolfNew);

        var wolves = parser.dbGet({categ: "actors", danger: 3});
        expect(wolves.hasOwnProperty("superwolf")).to.equal(true);
        var wolf1 = wolves["superwolf"];
        expect(wolf1).to.equal(superWolf);

        var wolfObj = new Actor("wolf");
        wolfObj.setAttack(15);
        wolfObj.setDefense(10);
        wolfObj.setDamage("1d6 + 2");
        var createdWolf = parser.createObj("actors", "wolf");
        expect(createdWolf.getAttack()).to.equal(wolfObj.getAttack());
        expect(createdWolf.getDefense()).to.equal(wolfObj.getDefense());
        expect(createdWolf.getType()).to.equal(wolfObj.getType());
        expect(createdWolf.getHP()).to.equal(wolfObj.getHP());

        var player = RG.FACT.createPlayer("player", {});
        player.setType("player");
        player.setIsPlayer(true);
        var cell = new RG.FACT.createFloorCell();
        cell.setProp("actors", player);
        cell.setExplored(true);

        var actorChar = RG.charStyles.actors.player;
        expect(RG.getCellChar(cell)).to.equal(actorChar);

        var randWolf = parser.createRandomActor({danger: 3});
        expect(randWolf.getAttack()).to.equal(superWolf.attack);

        var punyWolf = parser.parseObj("actors", {name: "Puny wolf",
            base: "wolf", attack: 1, defense: 50}
        );

        var punyWolfCreated = parser.createRandomActor({
            func: function(actor) {return actor.attack < 2;}
        });
        expect(punyWolfCreated.getDefense()).to.equal(50);
        expect(punyWolfCreated.getAttack()).to.equal(1);

    });
});

describe('How items are created from objects', function() {
   var parser = new Parser();
    it('description', function() {
        var foodBase = parser.parseObj("items", {type: "food", name: "foodBase",
        weight: 0.1, misc: "XXX", dontCreate: true, "char": "%"});

        var food = parser.parseObj("items", {base: "foodBase", name: "Dried meat",
            energy: 100, value: 5
        });
        expect(food.name).to.equal("Dried meat");
        expect(food.energy).to.equal(100);
        expect(food.value).to.equal(5);
        expect(food.type).to.equal("food");
        expect(food.weight).to.equal(0.1);

        var expFood = parser.parseObj("items", {name: "Gelee", energy: 500, 
            weight: 0.2, value: 100, base: "foodBase"});

        var geleeObj = parser.dbGet({name: "Gelee"})[0];
        expect(geleeObj.char).to.equal("%");

        var items = parser.dbGet({categ: "items"});
        expect(Object.keys(items).length).to.equal(2);

        var randFood = parser.createRandomItem({
            func: function(item) {return item.value <= 5;}
        });

        expect(randFood.getEnergy()).to.equal(100);
        expect(randFood.getValue()).to.equal(5);

        var geleeFood = parser.createRandomItem({
            func: function(item) {return item.value >= 99;}
        });
        expect(geleeFood.getEnergy()).to.equal(500);
        expect(geleeFood.getType()).to.equal("food");

        var testCell = RG.FACT.createFloorCell();
        testCell.setExplored(true);
        testCell.setProp("items", geleeFood);
        expect(RG.getCellChar(testCell)).to.equal("%");
    });
});

//---------------------------------------------------------------------------
// PARSING THE FULL OBJECTS FILE
//---------------------------------------------------------------------------

describe('It contains all game content info', function() {
    var parser = new Parser();
    parser.parseData(Obs);

    it('Should parse all actors properly', function() {
        var rsnake = parser.get("actors", "rattlesnake");
        expect(rsnake.poison).to.equal(true);
        var coyote = parser.get("actors", "coyote");
        expect(coyote.attack).to.equal(3);
        expect(coyote.danger).to.equal(2);
    });


    it('Should parse all items properly', function() {
    });
});

