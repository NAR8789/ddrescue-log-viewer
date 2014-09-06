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
        while (samplePos < entry.begin) {
            logString += "w";
            samplePos += step;
            entryPrinted = true;
        }
        var end = entry.begin + entry.size
        while (samplePos < end) {
            logString += entry.flag;
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

    return logString;
};

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
module.exports.sizeSummary = sizeSummary
