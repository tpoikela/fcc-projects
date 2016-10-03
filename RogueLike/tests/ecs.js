
var chai = require("chai");
var expect = chai.expect;
var RG = require("../roguelike.js");

/** Updates given systems in given order.*/
var updateSystems = function(systems) {
    for (var i = 0; i < systems.length; i++) {
        systems[i].update();
    }
};

describe('How hunger system works', function() {
    it('description', function() {
        var system = new RG.HungerSystem("Hunger", ["Hunger", "Action"]);
        var hunger = new RG.HungerComponent(2000);
        var action = new RG.ActionComponent();
        var player = RG.FACT.createPlayer("Player", {});
        player.add("Hunger", hunger);
        player.add("Action", action);
        action.addEnergy(100);
        expect(player.has("Hunger")).to.equal(true);
        expect(system.entities[player.getID()]).to.equal(player);
        expect(player.get("Action").getEnergy()).to.equal(100);
        system.update();
        expect(player.get("Hunger").getEnergy()).to.equal(2000 - 100);

    });

    it('Has combat components', function() {
        var player = RG.FACT.createPlayer("Player", {});
        var combatComp = new RG.CombatComponent();
        player.add("Combat", combatComp);
        expect(player.get("Combat").getDamage() >= 1).to.equal(true);
        expect(player.get("Combat").getDamage() <= 4).to.equal(true);
    });
});

describe('How loot is dropped by monsters', function() {
    var level = RG.FACT.createLevel("arena", 20, 20);
    var monster = RG.FACT.createMonster("TestMonster", {hp: 5, att: 1, def: 1, prot: 1});
    var human = RG.FACT.createMonster("Human", {hp: 5, att: 1, def: 1, prot: 1});

    var dSystem = new RG.DamageSystem("Damage", ["Damage"]);
    var systems = [dSystem];

    it('Drops loot when lethal damage is dealt', function() {
        var lootItem = new RG.RogueItem("Loot item");
        var loot = new RG.LootComponent(lootItem);
        monster.add("Loot", loot);
        var dmgComp = new RG.DamageComponent(6, "fire");
        dmgComp.setSource(human);
        monster.add("Damage", dmgComp);
        var lootCell = level.getMap().getCell(3, 6);
        level.addActor(monster, 3, 6);
        expect(lootItem.getOwner()).to.equal(null);
        expect(lootCell.hasProp("items")).to.equal(false);
        updateSystems(systems);
        expect(monster.get("Health").getHP()).to.equal(0);
        expect(lootItem.getOwner()).to.equal(lootCell);
        expect(lootCell.hasProp("items")).to.equal(true);

    });
});
