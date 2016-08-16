
var chai = require("chai");
var expect = chai.expect;
var RG = require("../roguelike.js");

var Memory = RG.RogueBrainMemory;
var Brain = RG.RogueBrain;

/** Updates given systems in given order.*/
var updateSystems = function(systems) {
    for (var i = 0; i < systems.length; i++) {
        systems[i].update();
    }
};

describe('How AI brain memory performs basic functions', function() {
    var hunter = RG.FACT.createMonster("hunter");
    var brain = new Brain(hunter);
    hunter.setBrain(brain);

    var animal = RG.FACT.createMonster("animal");
    var beast = RG.FACT.createMonster("beast");

    it('Keeps track of enemies', function() {
        var memory = new Memory(brain);

        expect(memory.isEnemy(animal)).to.equal(false);
        memory.addEnemy(animal);
        expect(memory.isEnemy(animal)).to.equal(true);

        expect(memory.isEnemy(beast)).to.equal(false);
        beast.setType("beast");
        memory.addEnemyType("beast");
        expect(memory.isEnemy(beast)).to.equal(true);
    });

    it('Keeps track of communications', function() {
        var memory = new Memory(brain);

        expect(memory.hasCommunicatedWith(animal)).to.equal(false);
        memory.addCommunicationWith(animal);
        expect(memory.hasCommunicatedWith(animal)).to.equal(true);
    });
});


describe('How actors communicate with each other', function() {
    var comSys = new RG.CommunicationSystem("Communication", ["Communication"]);
    var systems = [comSys];

    var hunter1 = RG.FACT.createMonster("hunter1");
    var hunter2 = RG.FACT.createMonster("hunter2");

    var brain1 = new Brain(hunter1);
    hunter1.setBrain(brain1);

    var brain2 = new Brain(hunter2);
    hunter2.setBrain(brain2);

    var animal = RG.FACT.createMonster("animal");

    it('Passes info between actors via comm components', function() {
        hunter1.addEnemy(animal);
        var mem1 = brain1.getMemory();

        var comComp = new RG.CommunicationComponent();
        comComp.addMsg({type: "Enemies", enemies: mem1.getEnemies()});
        hunter2.add("Communication", comComp);

        updateSystems(systems);

        var mem2 = brain2.getMemory();
        expect(mem2.isEnemy(animal)).to.equal(true);
    });
});

