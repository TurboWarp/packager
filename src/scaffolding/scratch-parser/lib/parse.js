/**
 * Converts string from unpack method into a project object. Note: this method
 * will be expanded greatly in the future in order to support the Scratch 1.4
 * file format. For now, this is nothing but an (awkward) async wrapper around
 * the `JSON.parse` function.
 * @param {string}   input    Stringified JSON object
 * @param {Function} callback Returns error or parsed JSON object
 * @return {void}
 */
module.exports = function (input, callback) {
    var result;
    try {
        // The input is a JSON string, which may contain control characters
        // that should be removed. See LLK/scratch-vm#1077
        // So far we've only encountered the backspace control character,
        // so remove that specific one before continuing.
        // SB2 JSONs and SB3 JSONs have different versions of the
        // character serialized (e.g. \u0008 and \b), strip out both versions
        result = JSON.parse(input.replace(/\\b|\\u0008/g, ''));
    } catch (e) {
        return callback(e.toString());
    }
    return callback(null, result);
};
