var readLine = function(line) {
    var tokens = line.split(/\s+/);
    if (tokens.length == 3 && tokens[0] !== "#" ) {
        return {
            begin: +tokens[0],
            size: +tokens[1],
            flag: tokens[2]
        };
    } else {
        return null;
    }
};

var readString = function(file) {
    return file
        .split('\n')
        .map(readLine)
        .filter(function(entry) {
            return (typeof entry === 'object' && entry !== null);
        });
}

module.exports.readString = readString;
