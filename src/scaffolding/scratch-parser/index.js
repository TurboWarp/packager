const promisify = (functionWithCallback) => (...args) => new Promise((resolve, reject) => {
    functionWithCallback(...args, (err, result) => {
        if (err) {
            if (typeof err === 'string') {
                // This will at least give a partial error stack.
                reject(new Error(err));
            } else {
                reject(err);
            }
        } else {
            resolve(result);
        }
    });
});

var unpack = promisify(require('./lib/unpack'));
var parse = promisify(require('./lib/parse'));
var validate = promisify(require('./lib/validate'));

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
