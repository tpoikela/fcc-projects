/**
 * Unit Tests for checking action scheduling and turn taking between actors.
 *
 */

var chai = require("chai");
var expect = chai.expect;
var RG = require("../roguelike.js");

var Actor = RG.RogueActor;
var Action = RG.RogueAction;
var Level = RG.RogueLevel;
var Element = RG.RogueElement;

describe('Basic functions for actors', function() {
    it('Acts like Locatable', function() {
        var actor = new Actor(true);
        actor.setXY(2, 10);
        expect(actor.getX()).to.equal(2);
        expect(actor.getY()).to.equal(10);
    });
});

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

describe('Scheduling one action', function() {
    it('Repeats the same actor indefinetely', function() {
        var sch = new RG.RogueScheduler();
        var actor = new Actor();
        var actorID = actor.id;

        var player = new Actor(true);
        var playerID = player.id;
        var falseActor = new Actor();

        var playerAction = new Action(15, function() {});
        var action = new Action(20, function() {});

        expect(actor.isPlayer()).to.equal(false);
        expect(player.isPlayer()).to.equal(true);

        actor.id = 1234;
        actorID = actor.id;

        sch.add(actor, true, 0);
        sch.add(player, true, 1);

        // t = 0
        var nextActor = sch.next();
        sch.setAction(action);
        expect(nextActor.id).to.equal(actorID);

        // t = 1
        nextActor = sch.next();
        sch.setAction(playerAction);
        expect(nextActor.id).to.equal(playerID);
        expect(nextActor.isPlayer()).to.equal(true);

        // t = 16
        nextActor = sch.next();
        sch.setAction(playerAction);
        expect(nextActor.id).to.equal(playerID);
        expect(nextActor.isPlayer()).to.equal(true);
        expect(sch.remove(actor)).to.equal(true);

        // t = 31
        nextActor = sch.next();
        sch.setAction(playerAction);
        expect(nextActor.id).to.equal(playerID);
        expect(nextActor.isPlayer()).to.equal(true);

        sch.add(actor, true, 0);
        nextActor = sch.next();
        sch.setAction(action);
        expect(nextActor.id).to.equal(1234);
        expect(nextActor.isPlayer()).to.equal(false);
        //expect(nextActor).to.equal(null);
        expect(sch.remove(player)).to.equal(true);

        expect(sch.remove(falseActor)).to.equal(false);

    });
});
