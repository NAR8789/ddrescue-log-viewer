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
    var entries = file
        .split('\n')
        .map(readLine)
        .filter(function(entry) {
            return (typeof entry === 'object' && entry !== null);
        });
    var totalSize = entries.reduce(function(totalSize, entry) {
        return totalSize + entry.size;
    }, 0);

    return {
        entries: entries,
        totalSize: totalSize
    };
}

module.exports.readString = readString;
