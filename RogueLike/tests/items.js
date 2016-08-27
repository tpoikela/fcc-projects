
var chai = require("chai");
var expect = chai.expect;
var RG = require("../roguelike.js");

var Item = RG.RogueItem;

var Slot = RG.RogueEquipSlot;

describe('How items are stacked', function() {
    it('Adds two items to create a count of 2', function() {
        var item1 = new RG.RogueItem("Test item");
        item1.setType("test");
        var item2 = new RG.RogueItem("Test item");
        item2.setType("test");
        expect(RG.addStackedItems(item1, item2)).to.equal(true);
        expect(item1.count).to.equal(2);
    });

    it('Stacks weapons correctly', function() {
        var weapon1 = new RG.RogueItemWeapon("Short sword");
        weapon1.setAttack(3);
        var weapon2 = new RG.RogueItemWeapon("Short sword");
        weapon2.setAttack(3);
        expect(weapon1.equals(weapon2)).to.equal(true);

        expect(RG.addStackedItems(weapon1, weapon2)).to.equal(true);

        var weapon3 = RG.removeStackedItems(weapon1, 1);
        expect(weapon3.getAttack()).to.equal(3);
    });
});

describe('How stacked are broken into multiple items', function() {
    it('Splits item stack into two items', function() {
        var itemStack = new RG.RogueItem("Arrow");
        itemStack.setType("missile");
        itemStack.count = 2;
        var arrow = RG.removeStackedItems(itemStack, 1);
        itemStack.setType("missile");
        expect(arrow.getName()).to.equal("Arrow");

        var hugeStack = new RG.RogueItem("Gold coin");
        hugeStack.setType("gold");
        hugeStack.count = 10000;
        var newStack = new RG.RogueItem("Gold coin");
        newStack.setType("gold");
        newStack.count = 100;

        var rm_ok = true;
        while (hugeStack.count > 9000 && rm_ok) {
            var coin = RG.removeStackedItems(hugeStack, 100);
            rm_ok = RG.addStackedItems(newStack, coin);
            expect(rm_ok).to.equal(true);
        }
        expect(coin.count).to.equal(100);
        expect(newStack.count).to.equal(1100);
        expect(hugeStack.count).to.equal(9000);

        var testStack = new RG.RogueItem("test item");
        testStack.setType("test");
        var stack = RG.removeStackedItems(testStack, 1);
        expect(testStack.count).to.equal(0);

        var two = new RG.RogueItem("test item");
        two.setType("test");
        two.count = 5;
        var rmvTwo = RG.removeStackedItems(two, 5);
        expect(rmvTwo.count).to.equal(5);
        expect(two.count).to.equal(0);


    });

    it('Manages missile items correctly', function() {
        var arrow = new RG.RogueItemMissile("arrow");
        arrow.setAttack(3);
        var arrow2 = new RG.RogueItemMissile("arrow");
        arrow2.setAttack(3);
        expect(RG.addStackedItems(arrow, arrow2)).to.equal(true);
        expect(arrow.count).to.equal(2);

        var arrow3 = new RG.RogueItemMissile("arrow");
        arrow3.setAttack(10);
        expect(RG.addStackedItems(arrow, arrow3)).to.equal(false);
        expect(arrow.count).to.equal(2);

        var rmvArrow = RG.removeStackedItems(arrow, 1);
        expect(arrow.count).to.equal(1);
    });
});

describe('How inventory container works', function() {
    var player = new RG.RogueActor("player");
    var invEq = new RG.RogueInvAndEquip(player);
    var inv = invEq.getInventory();

    it('Checks items by reference for existence', function() {
        var arrow = new RG.RogueItemMissile("arrow");
        var arrow2 = new RG.RogueItemMissile("arrow");
        expect(inv.hasItem(arrow)).to.equal(false);
        inv.addItem(arrow);
        expect(inv.hasItem(arrow)).to.equal(true);
        expect(inv.hasItemRef(arrow2)).to.equal(false);

        // 1. Add two non-count items
        inv.addItem(arrow2);
        expect(inv.first().count).to.equal(2);

        // 2. Add count and non-count items
        var steelArrow4 = new RG.RogueItemMissile("Steel arrow");
        var steelArrow1 = new RG.RogueItemMissile("Steel arrow");
        steelArrow4.count = 4;
        inv.addItem(steelArrow4);
        inv.addItem(steelArrow1);
        expect(inv.last().count).to.equal(5);

        // 3. Add non-count and count item
        var rubyArrow1 = new RG.RogueItemMissile("Ruby arrow");
        var rubyArrow6 = new RG.RogueItemMissile("Ruby arrow");
        rubyArrow6.count = 6;
        inv.addItem(rubyArrow1);
        inv.addItem(rubyArrow6);
        expect(inv.last().count).to.equal(7);

        // 4. Add two count items
        var ebonyArrow3 = new RG.RogueItemMissile("Ebony arrow");
        var ebonyArrow5 = new RG.RogueItemMissile("Ebony arrow");
        ebonyArrow3.count = 3;
        ebonyArrow5.count = 5;
        inv.addItem(ebonyArrow3);
        inv.addItem(ebonyArrow5);
        expect(inv.last().count).to.equal(8);

        arrow.count = 10;
        expect(inv.removeNItems(arrow, 2)).to.equal(true);
        expect(arrow.count).to.equal(8);
        var removed = inv.getRemovedItem();
        expect(removed.count).to.equal(2);

        expect(inv.removeNItems(arrow, 3)).to.equal(true);
        expect(arrow.count).to.equal(5);
        var removed2 = inv.getRemovedItem();
        expect(removed2.count).to.equal(3);

    });
});

describe('How item equipment slots work', function() {
    var player = new RG.RogueActor("player");
    var invEq = new RG.RogueInvAndEquip(player);
    var eq = invEq.getEquipment();
    var inv = invEq.getInventory();

    it('Holds items or stacks of items', function() {
        var eqSlot = new Slot(eq, "hand", false);
        var missSlot = new Slot(eq, "missile", true);

        var arrow = new RG.RogueItemMissile("arrow");
        arrow.count = 10;
        expect(missSlot.equipItem(arrow)).to.equal(true);
        expect(missSlot.unequipItem(5)).to.equal(true);

        var arrowStack = missSlot.getItem();
        expect(arrowStack.count).to.equal(5);
        expect(missSlot.unequipItem(5)).to.equal(true);
        var nullArrowStack = missSlot.getItem();
        expect(nullArrowStack === null).to.equal(true);

    });
});

describe('How item stacks work with equipped missiles', function() {
    var player = new RG.RogueActor("player");
    var invEq = new RG.RogueInvAndEquip(player);
    var inv = invEq.getInventory();
    var eq = invEq.getEquipment();


    it('description', function() {
        for (var i = 0; i < 10; i++) {
            var arrow = new RG.RogueItemMissile("arrow");
            invEq.addItem(arrow);
        }
        var newArrow = inv.first();
        expect(newArrow.count).to.equal(10);

        var sword = new RG.RogueItemWeapon("sword");
        invEq.addItem(sword);
        expect(invEq.equipItem(sword)).to.equal(true);

        // Add some arrows and test they're seen in inv
        var testArrow = new RG.RogueItemMissile("Steel arrow");
        testArrow.count = 12;
        invEq.addItem(testArrow);
        expect(invEq.hasItem(testArrow)).to.equal(true);
        expect(testArrow.count).to.equal(12);

        // Check that iterator last() works
        var arrowStack = inv.last();
        expect(arrowStack.count).to.equal(12);

        // Remove all arrows from inv
        expect(invEq.removeNItems(testArrow, 12)).to.equal(true);
        var removedArrows = invEq.getRemovedItem();
        expect(removedArrows.count).to.equal(12);
        expect(testArrow.count).to.equal(0);
        expect(invEq.hasItem(testArrow)).to.equal(false);

        // Add all arrows and equip one of them. Check that stack is decremented
        // by one
        testArrow.count = 12; // Add count back to 12
        invEq.addItem(testArrow); // Add arrows all at once
        expect(testArrow.count).to.equal(12);
        expect(invEq.hasItem(testArrow)).to.equal(true);
        expect(testArrow.count).to.equal(12);
        expect(invEq.equipItem(testArrow)).to.equal(true);
        expect(testArrow.count).to.equal(11);
        var oneArrow = invEq.getEquipped("missile");
        expect(oneArrow.count).to.equal(1);

        // Try to equip non-inv items
        var sixArrows = new RG.RogueItemMissile("Steel arrow");
        sixArrows.count = 6;
        expect(invEq.equipNItems(sixArrows, 6)).to.equal(true);
        expect(sixArrows.count).to.equal(6);
        //invEq.addItem(sixArrows);
        //expect(invEq.hasItem(sixArrows)).to.equal(true);
        var sevenArrows = invEq.getEquipped("missile");
        expect(sevenArrows.count).to.equal(7);

        var anotherSix = new RG.RogueItemMissile("Steel arrow");
        anotherSix.count = 6;
        invEq.addItem(anotherSix);
        expect(invEq.equipNItems(anotherSix, 6)).to.equal(true);
        var arrows13 = invEq.getEquipped("missile");
        expect(arrows13.count).to.equal(13);

        var shotArrow = invEq.unequipAndGetItem("missile", 3);
        expect(shotArrow.count).to.equal(3);
        var tenArrows = eq.getItem("missile");
        expect(tenArrows.count).to.equal(10);

        expect(invEq.unequipItem("missile", 1)).to.equal(true);
        var nineArrows = eq.getItem("missile");
        expect(nineArrows.count).to.equal(9);

    });

    it('Equips armour correctly', function() {
        var collar = new RG.RogueItemArmour("Collar");
        collar.setArmourType("neck");
        inv.addItem(collar);
        expect(invEq.equipItem(collar)).to.equal(true);

        var plate = new RG.RogueItemArmour("Plate mail");
        plate.setArmourType("chest");
        inv.addItem(plate);
        expect(invEq.equipItem(plate)).to.equal(true);

        var wolfSpirit = new RG.RogueItemSpirit("Wolf spirit");
        wolfSpirit.get("Stats").setStrength(9);
        inv.addItem(wolfSpirit);
        expect(invEq.equipItem(wolfSpirit)).to.equal(true);
        expect(eq.getStrength()).to.equal(9);

    });

});
