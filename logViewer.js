var fs = require('fs');

var granules = process.argv[3];

var legendLine = function(step, size, legend) {
    var result = legend + ":\t";
    for (var i = 0; i < Math.round(size/step); i++) {
        result += "-";
    }
    return result;
}

fs.readFile(process.argv[2], 'utf8', function(err, data) {
    var lines = data.split('\n');
    var log = [];
    var totalSize = 0;

    for ( var i = 0; i < lines.length; i++) {
        var line = lines[i];
        var tokens = line.split(/\s+/);
        if (tokens.length == 3 && tokens[0] !== "#" ) {
            var logEntry = {
                begin: +tokens[0],
                size: +tokens[1],
                flag: tokens[2]
            };
            log.push(logEntry);
            totalSize += logEntry.size;
        }
    }

    var samplePos = 0;
    var step = totalSize/granules;
    var logString = "";
    var nonPrintedEntries = 0;
    for (i = 0; i < log.length ;i++) {
        var logEntry = log[i];
        var entryPrinted = false;
        while (samplePos < logEntry.begin) {
            logString += "w";
            samplePos += step;
            entryPrinted = true;
        }
        var end = logEntry.begin + logEntry.size
        while (samplePos < end) {
            logString += logEntry.flag;
            samplePos += step;
            entryPrinted = true;
        }

        if (!entryPrinted) {
            nonPrintedEntries += 1;
        } else {
            if (nonPrintedEntries > 0) {
                logString += "[" + nonPrintedEntries + "]";
            } else {
                logString += ",";
            }
            nonPrintedEntries = 0;
        }
    }

    console.log("granule size is " + step);
    console.log(legendLine(step, 1024 * 1024 * 1024, "GiB"));
    console.log(logString);
});
