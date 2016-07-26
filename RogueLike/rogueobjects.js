

/**
 * THis file contains definitions for in-game objects, monsters and levels. It's
 * rather human-readable so it should be easy to add new stuff in. All contents
 * are used for procedural generation. 
 */

// Some info on attributes: 
//      dontCreate: true - Use with base classes
//      base: xxx        - Use xxx as a base for the object
//      danger           - Used for rand generation, higher values means less often
//      cssClass         - Used for rendering purposes.

var RGObjects = {

    monsters: [

        // ANIMALS
        {
            name: "animal", dontCreate: true,
            type: "animal",
            range: 1,
        },
        {
            name: "rattlesnake", "char": "s",
            base: "animal",
            poison: true,
            attack: 2,
            defense: 3,
            damage: "1d3",
            hp: 10, danger: 3,
        },
        {
            name: "coyote", "char": "c",
            base: "animal",
            attack: 3,
            defense: 3,
            damage: "1d4",
            hp: 12, danger: 2,
        },
        {
            name: "wolf", "char": "w",
            base: "animal",
            attack: 4,
            defense: 2,
            damage: "1d6",
            hp: 20, danger: 3,
        },

        // HUMANS
        {
            name: "human", "char": "@",
            type: "human",
            attack: 3, defense: 3,
            damage: "1d4",
            range: 1, hp: 20, danger: 3,
        },
        {
            name: "miner", base: "human",
            attack: 4, danger: 4,
        },
        {
            name: "robber", base: "human",
            attack: 2, defense: 4,

        }

    ],

    items: [
        // MELEE WEAPONS
        {
            name: "melee weapon",
            material: ["iron", "wood"],
            type: "weapon",
            range: 1, attack: 0, defense: 0,
            dontCreate: true, // Base class only
        },
        {
            name: "Whip", base: "melee weapon",
            material: "leather",
            damage: "1d6", range: 2, attack: -1,
            weight: 0.2, value: 10,
        },
        {
            name: "Pick-axe", base: "melee weapon",
            damage: "1d8", attack: 1, defense: 2,
            weight: 2.3, value: 15,
        },
        {
            name: "Tomahawk", base: "melee weapon",
            material: ["wood", "stone", "leather"],
            damage: "1d9 + 2", attack: 2, defense: 1,
            weight: 0.7, value: 20,
        },
        {
            name: "Spear", base: "melee weapon",
            damage: "1d8", attack: 1, defense: 3,
            weight: 1.2, value: 30,
        },

        // FOOD
        // Note: Food has energy X kcal/100g. Food items can have weight, but if
        // they don't, weight is then generated randomly. Value is also per
        // 100g.
        {
            name: "Dried meat",
            energy: "130",
            value: 2,
        },
        {
            name: "Corn",
            energy: "160",
            value: 3,
        },

        // TOOLS
        {
            name: "tool", type: "tool", uses: 10
        },
        {
            name: "Trapmaking kit", base: "tool",
        },

    ],

    // 
    levels: [
        {

        },

    ],

    // Dungeons contains multiple levels. Any levels specified above can be used
    // in the dungeon.
    dungeons: [

    ],

};

