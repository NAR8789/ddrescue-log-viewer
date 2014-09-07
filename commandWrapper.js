var fs = require('fs');
var logParser = require('./logParser');

/**
 * all commands so far have started off reading the file... that seems like a decent starting point
 * 
 * since this is intended as a command wrapper, we forgo the node convention of returning errors, and deal with them directly
 */
var command = function(callback) {
    fs.readFile(process.argv[2], 'utf8', function(err, data) {
        if (err) {
            return console.log(err);
        } else {
            return callback(logParser.readString(data));
        }
    });
}

module.exports.command = command;
