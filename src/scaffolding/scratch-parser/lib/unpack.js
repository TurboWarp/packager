var unzip = require('./unzip');

/**
 * If input a buffer, transforms buffer into a UTF-8 string.
 * If input is encoded in zip format, the input will be extracted and decoded.
 * If input is a string, passes that string along to the given callback.
 * @param {Buffer | string} input    Project data
 * @param {boolean}         isSprite Whether the input should be treated as
 * a sprite (true) or a whole project (false)
 * @param {Function}        callback Error or stringified project data
 * @return {void}
 */
module.exports = function (input, isSprite, callback) {
    if (typeof input === 'string') {
        // Pass string to callback
        return callback(null, [input, null]);
    }

    // Validate input type
    var typeError = 'Input must be a Buffer or a string.';
    if (!Buffer.isBuffer(input)) {
        try {
            input = new Buffer(input);
        } catch (e) {
            return callback(typeError);
        }
    }

    // Determine format
    // We don't use the file suffix as this is unreliable and mine-type
    // information is unavailable from Scratch's project CDN. Instead, we look
    // at the first few bytes from the provided buffer (byte signature).
    // https://en.wikipedia.org/wiki/List_of_file_signatures
    var signature = input.slice(0, 3).join(' ');
    var isLegacy = false;
    var isZip = false;

    if (signature.indexOf('83 99 114') === 0) isLegacy = true;
    if (signature.indexOf('80 75') === 0) isZip = true;

    // If not legacy or zip, convert buffer to UTF-8 string and return
    if (!isZip && !isLegacy) {
        // In browsers, the native TextDecoder can handle much larger values than the JavaScript polyfill for
        // Buffer.toString('utf-8'), particularly in Chrome.
        const decoder = new TextDecoder();
        return callback(null, [decoder.decode(input), null]);
    }

    // Return error if legacy encoding detected
    if (isLegacy) return callback('Parser only supports Scratch 2.X and above');

    unzip(input, isSprite, callback);
};
