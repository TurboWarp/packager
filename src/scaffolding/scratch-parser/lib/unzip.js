var JSZip = require('jszip');

/**
 * Unpacks a zip file.
 * @param {string}  input    Zip file provided as a string
 * @param {boolean} isSprite Whether the input should be treated as
 * a sprite (true) or whole project (false)
 * @param {array}   callback Array including both the project and zip archive
 * @return {void}
 */
module.exports = function (input, isSprite, callback) {
    var msg = 'Failed to unzip and extract project.json, with error: ';

    return JSZip.loadAsync(input)
        .then(function (zip) {
            // look for json in the list of files, or in a subdirectory
            // assumes there is only one sprite or project json in the zipfile
            const file = isSprite ?
                zip.file(/^([^/]*\/)?sprite\.json$/)[0] :
                zip.file(/^([^/]*\/)?project\.json$/)[0];
            if (file) {
                return file.async('string')
                    .then(function (project) {
                        return callback(null, [project, zip]);
                    });
            }
            return callback(msg + 'missing project or sprite json');
        })
        .catch(function (err) {
            return callback(msg + JSON.stringify(err));
        });

};
