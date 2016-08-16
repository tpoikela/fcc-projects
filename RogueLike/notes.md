RogueLike for FreeCodeCamp
==========================

These are the development notes for the roguelike game. It is built as a part of
the FreeCodeCamp projects.

Because React.js will be used for rendering the game "graphics", I am not going
to use any ASCII graphics features provided by the existing libraries.

Existing libraries and features
-------------------------------

Possible existing libraries for roguelike.js development:

### [rot.js](https://ondras.github.io/rot.js/hp/) ###

- RNG, Map generation, FOV, Lighting
- Pathfinding, turn scheduling

### [Cave of Epokothar](https://github.com/eballot/CaveOfEpokothar/tree/gh-pages) ###

Not an actual library, but the sources of the game.


### [MooTools](http://mootools.net/) ###

Collection of utilities (was used for js-Moria port). Not an actual roguelike
library.

Existing roguelike games in JavaScript
--------------------------------------

[js-Roguelikes](http://www.roguebasin.com/index.php?title=JavaScript#Roguelikes_in_JavaScript)


Game Views
----------------

The game will contain three different structures:

  1. The global map
  2. Simulation range (where game actions/events take place)
  3. Viewport (rendered by React, based on the position and global map)

The global map will be an N x M array of smaller chunks. Each chunk will be of
equal dimensions X x Y. This can be chosen at the start to a certain extent
(small, medium, large) world/levels.

Simulation range is always set to current chunk where player is. Each
action/event will then take place. Monsters move only in this simulation range.
To make game feel more realistic, passing of time is simulated in each chunk
based on when the player last visited the chunk.

Viewport is zoomable, and can be resized easily for smaller screen.
This means that monsters can come from outside the viewport, and also perform
out of screen attacks.

Scheduling
----------

I implemented a scheduler system in Perl some years ago already. For this game,
I skip it and use an existing solution. rot.js has already nice scheduler API.
I chose to use ROT.Scheduler.Action because it offers the possibility of changing
speeds of individual actions. This offers much more realistic experience than
all actions having the same speed. This is also useful for spawning because a
spawn event can scheduled with random 

Initially, all monsters can start at the same speed, but this can be easily
changed later on.

Monster implementation
----------------------

There's very little difference between monster and player actors in terms of
development. The biggest difference will be a Brain object. Each actor has a
Brain, and delegates its next action decision to the brain. In the case of the
player, PlayerBrain will simply decode the key press given by the user, and
return a corresponding action callback. In case of a monster, the callback is chosen by
an AI. Different types of brains can be defined for different monsters.

AI brains are defined by composition. Each brain has a set of behaviours, each
behaviour being a separate object. This makes it possible to create, for
example, SummoningBehaviour for summoners. MovementBehaviour and
AttackBehaviour can then be chosen differently for different types of summoners.

```javascript
RogueBrain = function(actor) {
    this.actor = actor;
    this.behav = {};

    this.addBehav = function(key, behav) {

    };

    this.decideNextAction = function(obj) {
        var nextBehav = this.getNextBehav(obj);
        return this.behav[nextBehav].doBehav(obj);
    };

};

XXXBrain = function(actor) {
    RogueBrain.call(this, actor);


    this.getNextBehav = function(obj) {

    };

};

```

TODO-list
---------
    1. Create friendly NPCs, their brains and behaviour.
    2. Add proper ending after Summoner's been defeated.
    3. Add "Spirit" feature for enhancements. Add willpower.
    4. Implement combat between NPCs and monsters.
    N. Create a highscore system.
    N+1. Create a saving system.

DONE-list
---------
    1. Player can move around freely, but bumps into monsters/walls.
    2. FoV is implemented for all actors. Walls block the light.
    3. Crude combat system is in place. Actors can die.
    4. When an actor dies, remove all traces of it from the scheduler.
    5. Added in-game message printing routines for understanding what's going on.
    6. Added support for multiple levels. Added stairs-objects.
    7. Actors can now be moved between levels. AI doesn't do this yet.
    8. Created inventory and equipment systems.
    9. Added healing potions with useItem-function.
    10. Created a summoner to act as a final boss.
    11. Added support for armour and other defensive equipment.
    12. Added a hunger system.
    13. Implemented ranged combat.
    14. Added optional configuration to the beginning of the game.
    15. Added some iron, ice and magic armour to the game.

