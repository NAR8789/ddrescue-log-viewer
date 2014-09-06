var filesize = require('filesize');

var linearVisual = function(log, granules) {
    var entries = log.entries;
    var totalSize = log.totalSize;

    var granulePos = 0;
    // we calculate samplePos from granulePos, in order to avoid float error
    var samplePos = function() {
        return (granulePos / granules) * totalSize;
    };
    var logString = "";
    var nonPrintedEntries = 0;
    var nonPrintedOffset = 0;   // ogod, waaat? erm... see the logic for this in the middle of the loop
    for (i = 0; i < entries.length ;i++) {
        var entry = entries[i];
        var entryPrinted = false;
        var entryString = "";
        while (samplePos() < entry.begin) {
            entryString += "w";
            granulePos += 1;
            entryPrinted = true;
        }
        var end = entry.begin + entry.size
        while (samplePos() < end) {
            entryString += entry.flag;
            granulePos += 1;
            entryPrinted = true;
        }

        if (!entryPrinted) {
            nonPrintedEntries += 1;
        } else {
            if (nonPrintedEntries > 0) {
                var nonPrintedEntriesToken = "[" + nonPrintedEntries + "]";

                // To retain output length, the nonPrintedEntriesToken will "cover" other tokens.
                var coveredLength = nonPrintedEntriesToken.length - nonPrintedOffset;
                var entryLength = entryString.length;
                if (entryString.length <= coveredLength) {
                    // Count entry as non-printed.
                    nonPrintedEntries += 1;
                    // Do not print entry string.
                    entryString = "";
                    // Even though the string wasn't printed, we need to retain its output offset.
                    // In a sense we want to print it "under" the nonprinting flag.
                    nonPrintedOffset += entryLength;
                } else {
                    // Truncate entry string.
                    entryString = nonPrintedEntriesToken + entryString.slice(coveredLength);
                    // Reset non-printed state.
                    nonPrintedEntries = 0;
                    nonPrintedOffset = 0;
                }
            }
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
    var scale = Math.pow(10, Math.round(Math.log(step)/Math.log(10)) + 1);
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
