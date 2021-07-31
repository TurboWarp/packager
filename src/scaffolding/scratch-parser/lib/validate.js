module.exports = function (isSprite, input, callback) {
    if ('objName' in input) {
        input.projectVersion = 2;
        return callback(null, input);
    }
    if (isSprite) {
        if ('name' in input) {
            input.projectVersion = 3;
            return callback(null, input);
        }
    } else {
        if ('targets' in input) {
            input.projectVersion = 3;
            return callback(null, input);
        }
    }
    callback(new Error('Could not parse as a valid SB2 or SB3 project.'));
};
