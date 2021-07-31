var pify = require('pify');

var unpack = pify(require('./lib/unpack'));
var parse = pify(require('./lib/parse'));
var validate = pify(require('./lib/validate'));

module.exports = function (input, isSprite, callback) {
    unpack(input, isSprite)
        .then(function (unpackedProject) {
            return parse(unpackedProject[0])
                .then(validate.bind(null, isSprite))
                .then(function (validatedProject) {
                    return [validatedProject, unpackedProject[1]];
                });
        })
        .then(callback.bind(null, null), callback);
};
