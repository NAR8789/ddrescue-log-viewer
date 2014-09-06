var filesize = require('filesize');

var linearVisual = function(log, granules) {
    var entries = log.entries;
    var totalSize = log.totalSize;

    var samplePos = 0;
    var step = totalSize/granules;
    var logString = "";
    var nonPrintedEntries = 0;
    for (i = 0; i < entries.length ;i++) {
        var entry = entries[i];
        var entryPrinted = false;
        var entryString = "";
        while (samplePos < entry.begin) {
            entryString += "w";
            samplePos += step;
            entryPrinted = true;
        }
        var end = entry.begin + entry.size
        while (samplePos < end) {
            entryString += entry.flag;
            samplePos += step;
            entryPrinted = true;
        }

        if (!entryPrinted) {
            nonPrintedEntries += 1;
        } else {
            if (nonPrintedEntries > 0) {
                entryString = "[" + nonPrintedEntries + "]" + entryString;
            } else {
                if (i > 0) {
                    entryString = "," + entryString;
                }
            }
            nonPrintedEntries = 0;
        }

        logString += entryString;
    }

    return logString;
};

var legendLine = function(step) {
    // want something bigger than the individual step, probably seeking sizing between... sqrt(10)x and 10sqrt(10)x. 
    // x10^0.5 <= 10^k <= x10^1.5
    // log(x) + 0.5 <= k <= log(x) + 1.5
    // (log(x) + 1) - 0.5 <= k <= (log(x) + 1) + 0.5
    // k = round(log(x) + 1)     (= (log(x) + 1) + r, for some rounding factor r satisfying -0.5 <= r <= 0.5)
    var scale = Math.pow(10, Math.round(Math.log(step)/Math.log(10) + 1));
    var legend = filesize(scale);

    var result = legend + ": ";
    for (var i = 0; i < Math.round(scale/step); i++) {
        result += "-";
    }
    return result;
}

var sizeSummary = function(log) {
    return log.entries.reduce(function(sizeSummary, entry) {
        if (!(entry.flag in sizeSummary)) {
            sizeSummary[entry.flag] = 0;
        }
        sizeSummary[entry.flag] += entry.size;
        return sizeSummary;
    }, {});
};

module.exports.linearVisual = linearVisual;
module.exports.sizeSummary = sizeSummary;
module.exports.legendLine = legendLine;
