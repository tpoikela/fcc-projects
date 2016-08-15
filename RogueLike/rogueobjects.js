

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

    // Can be used in items freely
    /*effects: {
        poison: function() {

        },
        healing: function() {
        },
    },*/

    actors: [

        // ANIMALS
        {
            name: "animal", dontCreate: true,
            className: "cell-actor-animal",
            attack: 1, defense: 1, hp: 5,
            range: 1, danger: 1, speed: 100
        },
        {
            name: "bat", type: "bat", "char": "b", base: "animal",
        },
        {
            name: "Ice bat", base: "bat", danger: 2, hp: 8, speed: 110,
        },
        {
            name: "rat", type: "rat", "char": "r", base: "animal",
        },
        {
            name: "rattlesnake", "char": "s", base: "animal",
            poison: true, // Change to weapon: venomous fangs
            attack: 2, defense: 3, damage: "1d3",
            hp: 10, danger: 3,
        },
        {
            name: "coyote", "char": "c", base: "animal",
            attack: 3, defense: 3, damage: "1d4",
            hp: 12, danger: 2,
        },
        {
            name: "wolf", "char": "w", base: "animal",
            attack: 4, defense: 2, damage: "1d6",
            hp: 15, danger: 3,
        },
        // HUMANOIDS
        {
            name: "humanoid", "char": "h", type: "humanoid",
            attack: 1, defense: 1, damage: "1d4", range: 1, hp: 10,
            danger: 2
        },
        // DEMONS AND WINTRY BEINGS
        {
            name: "Winter demon", type: "demon", "char": "d",
            attack: 5, defense: 5, damage: "3d3", range: 1, hp: 30,
            danger: 6
        },

        // HUMANS
        {
            name: "human", "char": "@", type: "human",
            attack: 2, defense: 2, damage: "1d4",
            range: 1, hp: 20, danger: 3,
        },
        {
            name: "miner", base: "human",
            attack: 4, danger: 4, damage: "1d5",
        },
        {
            name: "robber", base: "human",
            attack: 2, defense: 4,
        },
        {
            name: "fighter", base: "human", hp: 25,
            attack: 4, defense: 4, damage: "1d8",
            danger: 5,
        },
        {
            name: "warlord", base: "human", hp: 35,
            attack: 5, defense: 6, damage: "3d3",
            danger: 6
        },
        // WILDLINGS
        {
            name: "wildling", "char": "I", className: "cell-actor-wildling",
            type: "wildling",
            attack: 4, defense: 1, damage: "1d6", range: 1,
            hp: 15, danger: 3
        },
        {
            name: "wildling warrior", base: "wildling",
            attack: 6, defense: 3, damage: "1d10", hp: 25, danger: 5
        },

    ],

    items: [
        //------------------------------------------------------------
        // MELEE WEAPONS
        //------------------------------------------------------------
        {
            name: "MeleeWeaponBase", className: "cell-item-melee-weapon",
            "char": "(",
            material: ["iron", "wood"],
            type: "weapon",
            range: 1, attack: 0, defense: 0,
            dontCreate: true, // Base class only
        },
        {
            name: "Dagger", base: "MeleeWeaponBase",
            material: "iron",
            damage: "1d4",
            weight: 0.2, value: 5,
        },
        {
            name: "Bayonette", base: "MeleeWeaponBase",
            material: "iron",
            damage: "1d5",
            weight: 0.1, value: 10,
            // TODO combine with rifle
        },
        {
            name: "Short sword", base: "MeleeWeaponBase",
            material: "iron",
            damage: "1d6",
            weight: 0.5, value: 20,
        },
        {
            name: "Whip", base: "MeleeWeaponBase",
            material: "leather",
            damage: "1d6", range: 2, attack: -1,
            weight: 0.2, value: 10,
        },
        {
            name: "Pick-axe", base: "MeleeWeaponBase",
            damage: "1d8", attack: 1, defense: 2,
            weight: 2.3, value: 15,
        },
        {
            name: "Saber", base: "MeleeWeaponBase",
            material: "iron",
            damage: "2d4 + 1", attack: 2, attack: 1,
            weight: 0.6, value: 20,
        },
        {
            name: "Spear", base: "MeleeWeaponBase",
            damage: "1d8", attack: 1, defense: 3,
            weight: 1.2, value: 30,
        },
        {
            name: "Tomahawk", base: "MeleeWeaponBase",
            material: ["wood", "stone", "leather"],
            damage: "1d9 + 2", attack: 2, defense: 1,
            weight: 0.7, value: 40,
        },
        // MAGIC WEAPONS
        {
            name: "MagicWeaponBase", base: "MeleeWeaponBase",
            className: "cell-item-magic",
            material: "forium", dontCreate: true,
        },
        {
            name: "Magic short sword", base: "MagicWeaponBase",
            damage: "3d5 + 3",
            attack: 3, defense: 2, weight: 0.7, value: 300
        },
        {
            name: "Magic sword", base: "MagicWeaponBase",
            damage: "5d5 + 3",
            attack: 5, defense: 2, weight: 1.0, value: 500
        },
        // ARMOUR
        {
            name: "ArmourBase", type: "armour", className: "cell-item-armour",
            "char": "[", dontCreate: true, attack: 0, defense: 0, protection: 0,
        },

        // ARMOUR LEATHER
        {
            name: "Leather helmet", base: "ArmourBase",
            weight: 0.3, defense: 1, material: "leather",
            armourType: "head", value: 15,
        },
        {
            name: "Leather collar", base: "ArmourBase",
            weight: 0.2, protection: 1, material: "leather",
            armourType: "neck", value: 15,
        },
        {
            name: "Leather boots", base: "ArmourBase",
            weight: 0.5, defense: 1, material: "leather",
            armourType: "feet", value: 15,
        },
        {
            name: "Leather armour", base: "ArmourBase",
            weight: 2.0, defense: 2, material: "leather", protection: 2,
            armourType: "chest", value: 30,
        },

        // ARMOUR IRON
        {
            name: "Iron helmet", base: "ArmourBase",
            weight: 0.6, defense: 1, protection: 1, material: "iron",
            armourType: "head", value: 45,
        },
        {
            name: "Iron collar", base: "ArmourBase",
            weight: 0.6, protection: 2, material: "iron",
            armourType: "neck", value: 45,
        },
        {
            name: "Iron boots", base: "ArmourBase",
            weight: 1.2, defense: 1, protection: 1, material: "iron",
            armourType: "feet", value: 45,
        },
        {
            name: "Iron armour", base: "ArmourBase",
            weight: 4.0, defense: 1, protection: 3, material: "iron",
            armourType: "chest", value: 90,
        },

        // ARMOUR ICE
        {
            name: "IceArmourBase", base: "ArmourBase", dontCreate: true,
            material: "permaice", className: "cell-item-ice",
        },
        {
            name: "Ice helmet", base: "IceArmourBase",
            weight: 1.0, defense: 1, protection: 3, 
            armourType: "head", value: 200,
        },

        // ARMOUR MAGIC
        {
            name: "MagicArmourBase", base: "ArmourBase", dontCreate: true,
            material: "forium", className: "cell-item-magic",
        },
        {
            name: "Magic helmet", base: "MagicArmourBase",
            weight: 0.3, defense: 3, protection: 4,
            armourType: "head", value: 200,
        },
        {
            name: "Magic collar", base: "MagicArmourBase",
            weight: 0.1, defense: 3, protection: 2,
            armourType: "neck", value: 200,
        },
        {
            name: "Magic boots", base: "MagicArmourBase",
            weight: 0.5, defense: 3, protection: 2,
            armourType: "feet", value: 200,
        },
        {
            name: "Magic armour", base: "MagicArmourBase",
            weight: 2.0, defense: 10, protection: 10,
            armourType: "chest", value: 500,
        },

        // MISSILES
        {
            name: "MissileBase", className: "cell-item-missile", "char": "/",
            type: "missile", dontCreate: true,
            attack: 1, damage: "1d1", range: 2, weight: 0.1
        },
        {
            name: "Shuriken", base: "MissileBase",
            damage: "1d4", range: 3, value: 10,
        },
        {
            name: "Dart", base: "MissileBase",
            damage: "1d4 + 1", range: 4, value: 30,
        },
        {
            name: "Magic Shuriken", base: "MissileBase",
            damage: "3d4 + 2", range: 5, value: 100, weight: 0.1
        },
        {
            name: "Throwing axe of death", base: "MissileBase",
            attack: 2, damage: "2d10 + 3", range: 3, value: 200, weight: 0.5,
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

