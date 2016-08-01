

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

    actors: [

        // ANIMALS
        {
            name: "animal", dontCreate: true,
            className: "cell-actor-animal",
            attack: 1, defense: 1, hp: 10,
            range: 1, danger: 1, 
        },
        {
            name: "bat", type: "bat", "char": "b", base: "animal",
        },
        {
            name: "rat", type: "rat", "char": "r", base: "animal",
        },
        {
            name: "rattlesnake", "char": "s", base: "animal",
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
        //------------------------------------------------------------
        // MELEE WEAPONS
        //------------------------------------------------------------
        {
            name: "melee weapon", className: "cell-item-melee-weapon",
            "char": "(",
            material: ["iron", "wood"],
            type: "weapon",
            range: 1, attack: 0, defense: 0,
            dontCreate: true, // Base class only
        },
        {
            name: "Dagger", base: "melee weapon",
            material: "iron",
            damage: "1d4",
            weight: 0.2, value: 5,
        },
        {
            name: "Bayonette", base: "melee weapon",
            material: "iron",
            damage: "1d5",
            weight: 0.1, value: 10,
            // TODO combine with rifle
        },
        {
            name: "Short sword", base: "melee weapon",
            material: "iron",
            damage: "1d6",
            weight: 0.5, value: 20,
            // TODO combine with rifle
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
            name: "Saber", base: "melee weapon",
            material: "iron",
            damage: "2d4 + 1", attack: 2, attack: 1,
            weight: 0.6, value: 20,
        },
        {
            name: "Spear", base: "melee weapon",
            damage: "1d8", attack: 1, defense: 3,
            weight: 1.2, value: 30,
        },

        // ARMOUR
        {
            name: "ArmourBase", type: "armour", className: "cell-item-armour",
            "char": "[", dontCreate: true
        },
        {
            name: "Leather armour", base: "ArmourBase",
            weight: 2.0, attack: 0, defense: 2, material: "leather",
            armourType: "chest", value: 20,
        },
        {
            name: "Leather helmet", base: "ArmourBase",
            weight: 0.3, attack: 0, defense: 1, material: "leather",
            armourType: "head", value: 15,
        },

        // POTIONS
        // Note: Each potion should define useItem method. See examples below.
        {
            name: "PotionBase", className: "cell-item-potion", "char": "!",
            type: "potion", dontCreate: true,
        },

        // FOOD
        // Note: Food has energy X kcal/100g. Food items can have weight, but if
        // they don't, weight is then generated randomly. Value is also per
        // 100g.
        {
            name: "FoodBase", className: "cell-item-food", "char": "%",
            weight: 0.1, type: "food", dontCreate: true,
        },
        {
            name: "Dried meat", base: "FoodBase", energy: 130, value: 2,
        },
        {
            name: "Corn", base: "FoodBase", energy: 160, value: 3,
        },
        {
            name: "Habanero", base: "FoodBase", energy: 10, value: 50,
        },

        // TOOLS
        // Note: Each tool should have useItem method.
        {
            name: "tool", type: "tool", uses: 10
        },
        {
            name: "Trapmaking kit", base: "tool",
        },

        // SPIRIT GEMS

    ],

    // 
    /*
    levels: [
        {

        },

    ],
   */

    // Dungeons contains multiple levels. Any levels specified above can be used
    // in the dungeon.
    /*
    dungeons: [

    ],
   */

};


// To make this work in browser/node
if ( typeof exports !== 'undefined' ) {
    if( typeof RGObjects !== 'undefined' && module.exports ) {
        exports = module.exports = RGObjects;
    }
    exports.RGObjects = RGObjects;
}
else {
    window.RGObjects = RGObjects;
}

