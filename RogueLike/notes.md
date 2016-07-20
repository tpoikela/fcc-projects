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

  1. The global map (which holds the game state)
  2. Simulation range (where game actions/events take place)
  3. Viewport (rendered by react, based on position and global map)

The global map will be an N x M array. This can be chosen at the start to
a certain extent (small, medium, large) world.

Simulation range is always scanned for events/actors every time the player takes an
action. Each action/event will then take place. Monsters move only in this
simulation range.

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
Brain, and delegates its next action decision to the brain. In case of the
player, Player Brain will simply decode the command given by the player and
return a corresponding callback. In case of a monster, the callback is chosen by
a simple AI. Different types of brains can be defined for different monsters.

TODO-list
---------
    1. Cleanup the existing GUI of additional buttons.
    3. Add support for multiple levels.
        - Add Stairs object
        - Create a keybinding for ascending/descending the stairs
        - Implement code in Game to move actors between levels

    4. Create inventory system and implement items.
        - Create binding for picking up items.
        - Create healing items
        - Create weapons
    5. Create a boss 
    6. Create a highscore system

DONE-list
---------
    1. Player can move around freely, but bumps into monsters/walls.
    2. FoV is implemented for all actors. Walls block the light.
    3. Crude combat system is in place. Actors can die.
    4. When an actor dies, remove all traces of it from the scheduler.
    5. Added in-game message printing routines for understanding what's going on.



Development notes
-----------------

After 1h of starting with rot.js, I was able to generate the first arena with my
react-rendered GUI.


