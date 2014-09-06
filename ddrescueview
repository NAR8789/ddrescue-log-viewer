#!/usr/bin/nodejs

var fs = require('fs');
var logParser = require('./logParser');

var granules = process.argv[3];

var legendLine = function(step, size, legend) {
    var result = legend + ":\t";
    for (var i = 0; i < Math.round(size/step); i++) {
        result += "-";
    }
    return result;
}

fs.readFile(process.argv[2], 'utf8', function(err, data) {
    if (err) {
        return console.log(err);
    }

    var log = logParser.readString(data);

    var totalSize = log.reduce(function(totalSize, logEntry) {
        return totalSize + logEntry.size;
    }, 0);

    var sizeBreakdown = log.reduce(function(sizeBreakdown, logEntry) {
        if (!(logEntry.flag in sizeBreakdown)) {
            sizeBreakdown[logEntry.flag] = 0;
        }
        sizeBreakdown[logEntry.flag] += logEntry.size;
        return sizeBreakdown;
    }, {});

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
    for (var flag in sizeBreakdown) {
        console.log(flag + ": " + sizeBreakdown[flag]);
    }
    console.log(logString);
});
