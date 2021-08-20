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
        result = JSON.parse(input.replace(
            /(\\+)(b|u0008)/g,
            (match, backslash, code) => {
                // If the number is odd, there is an actual backspace.
                if (backslash.length % 2) {
                    // The match contains an actual backspace, instead of backslashes followed by b.
                    // Remove backspace and keep backslashes that are not part of
                    // the control character representation.
                    return match.replace('\\' + code, '');
                }
                // They are just backslashes followed by b or u0008. (e.g. "\\b")
                // Don't replace in this case. (LLK/scratch-parser#56)
                return match;
            }
        ));
    } catch (e) {
        return callback(e.toString());
    }
    return callback(null, result);
};
