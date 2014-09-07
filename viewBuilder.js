var filesize = require('file-size');

/**
 * Given a log, produces metadata about which entries should be printed
 */
var linearVisualMetadata = (function() {
    var buildEntry = function(printPos, logEntry) {
        var entry = function Entry() {};

        entry.printPos = printPos;
        entry.logEntry = logEntry;
        entry.printLength = 0;
        entry.printed = function() {
            return entry.printLength > 0;
        }
        entry.endPos = function() {
            return entry.printPos + Math.max(0,entry.printLength - 1);
        }
        entry.flag = function() {
            return entry.logEntry ? logEntry.flag : "w";
        }
        entry.toString = (function() {
            var memoString = undefined;

            return function() {
                if (typeof memoString !== "string") {
                    memoString = "";
                    var flag = entry.flag();
                    for(var i = 0; i < entry.printLength; i++) {
                        memoString += flag;
                    }
                }

                return memoString;
            };
        }());

        return entry;
    };

    return function(log, granules) {
        var logEntries = log.entries;
        var totalSize = log.totalSize;

        var granulePos = 0;
        // we calculate samplePos from granulePos, in order to avoid float error
        var samplePos = function() {
            return (granulePos / granules) * totalSize;
        };
        var metadata = [];
        for (i = 0; i < logEntries.length ;i++) {
            var logEntry = logEntries[i];

            // handle gaps in the logfile
            var entry = buildEntry(granulePos);
            while (samplePos() < logEntry.begin) {
                granulePos += 1;
                entry.printLength += 1;
            }
            if (entry.printed()) {
                metadata.push(entry);
            }

            // handle the meat of the logEntry
            entry = buildEntry(granulePos, logEntry);
            var end = logEntry.begin + logEntry.size
            while (samplePos() < end) {
                granulePos += 1;
                entry.printLength += 1;
            }
            metadata.push(entry);
        }

        return metadata;
    };
}());

/**
 * Given a linearVisual metadata log, produce a map of clusters of nonprinted entries, mapped by print position
 */
var linearVisualNonprinted = function(data) {
    return data
        .filter(function(datum) {
            return !datum.printed();
        })
        .reduce(function(nonPrints, datum, index) {
            if (typeof nonPrints[datum.printPos] === "undefined") {
                nonPrints[datum.printPos] = [];
            }
            nonPrints[datum.printPos].push(datum);
            return nonPrints;
        }, []);
};

/**
 * Given a linearVisual metadata log, produce a map of clusters of nonprinted entries, mapped by print position
 *
 * This version takes into account occlusion
 */
var linearVisualNonprinted2 = function(data, occlusionOf) {
    return data
        .reduce(function(state, datum, index) {
            var nonPrints = state.nonPrints;
            var occlusion = state.occlusion;

            // check for occlusion
            var occluded = false;
            var printPos = datum.printPos;
            if (typeof occlusion !== "undefined" && datum.endPos() < occlusion.end) {
                occluded = true;
                printPos = occlusion.printPos;
            } else {
                occlusion = undefined;
                state.occlusion = undefined;
            }

            // ignore visible markers
            if (datum.printed() && !occluded) {
                return state;
            }

            // update nonPrints
            if (typeof nonPrints[printPos] === "undefined") {
                nonPrints[printPos] = [];
            }
            nonPrints[printPos].push(datum);

            // update occlusion
            if (typeof occlusion === "undefined") {
                occlusion = {
                    printPos: printPos,
                };
                state.occlusion = occlusion;
            }
            occlusion.end = printPos + occlusionOf(nonPrints[printPos]);

            return state;
        }, {nonPrints: []}).nonPrints;
};

/**
 * Given a linearVisual metadata log, produce a string for console printing
 */
var linearVisualString = function(data) {
    return data
        .filter(function(datum) {
            return datum.printed();
        })
        .reduce(function(printString, datum) {
            return printString + datum.toString();
        }, "");
};

var nonPrintingClusterMarker = function(nonPrintingCluster) {
    return "[" + nonPrintingCluster.length + "]";
}

var nonPrintingClusterBadSize = function(nonPrintingCluster) {
    var badSize = nonPrintingCluster
        .filter(function(cluster) {
            return cluster.flag() !== "+";
        })
        .reduce(function(badSize, cluster) {
            return badSize + cluster.logEntry.size;
        }, 0);
    return "[" + filesize(badSize).human() + "]";
}

/**
 * given a linearVisual metadata log, produce a string for console printing, decorated with nonprinted cluster markers
 */
var linearVisualDecoratedString = function(data) {
    var nonPrintingMarker = nonPrintingClusterBadSize;
    return linearVisualNonprinted2(
            data,
            function(cluster) {
                return nonPrintingMarker(cluster).length;
            })
        .reduce(function(output, datum, printLocation) {
            var marker = nonPrintingMarker(datum);
            return output.slice(0,printLocation) + marker + output.slice(printLocation + marker.length);
        }, linearVisualString(data));
}

/**
 * Given a linearVisual metadata log, print it to console
 */
var linearVisual = function(log, granules) {
    return linearVisualDecoratedString(linearVisualMetadata(log, granules));
};

var legendLine = function(step) {
    // want something bigger than the individual step, probably seeking sizing between... sqrt(10)x and 10sqrt(10)x. 
    // x10^0.5 <= 10^k <= x10^1.5
    // log(x) + 0.5 <= k <= log(x) + 1.5
    // (log(x) + 1) - 0.5 <= k <= (log(x) + 1) + 0.5
    // k = round(log(x) + 1)     (= (log(x) + 1) + r, for some rounding factor r satisfying -0.5 <= r <= 0.5)
    var decimalMagnitude = Math.round(Math.log(step)/Math.log(10)) + 1;
    var scale = Math.pow(2, Math.floor(decimalMagnitude / 3) * 10) * Math.pow(10,decimalMagnitude % 3);
    var legend = filesize(scale).human();

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

var regionSpec = function(logEntry) {
    return "-i 0x" + logEntry.begin.toString(16).toUpperCase() + " -s 0x" + logEntry.size.toString(16).toUpperCase();
}

module.exports.linearVisual = linearVisual;
module.exports.sizeSummary = sizeSummary;
module.exports.legendLine = legendLine;
module.exports.regionSpec = regionSpec;
