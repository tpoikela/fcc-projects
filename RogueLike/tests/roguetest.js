
/** Note: This file doesn't contain any unit tests. It has some architecture for
 * performing common test function.*/

var chai = require("chai");
var expect = chai.expect;

var RGTest = {

};

RGTest.checkActorXY = function(actor, x, y) {
    expect(actor.getX()).to.equal(x);
    expect(actor.getY()).to.equal(y);
};


if ( typeof exports !== 'undefined' ) {
    if( typeof RGTest !== 'undefined' && module.exports ) {
        exports = module.exports = RGTest;
    }
    exports.RGTest = RGTest;
}
else {
    window.RGTest = RGTest;
}
