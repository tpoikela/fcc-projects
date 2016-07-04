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

Simulation range is always scanned for events every time the player takes an
action. Each action/event will then take place. Monsters move only in this
range. 

Viewport is zoomable, and can be resized easily for smaller screen.
This means that monsters can come from outside the viewport.

TODO-list
---------

