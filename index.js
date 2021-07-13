#!/usr/bin/env node

require('colors');


function showHelp() {
    console.log("Lookup of production uglified,minified,compressed,... javascript stack trace line and column number and display actual source code location.");
    console.log("");
    console.log("Usage: \n\tonline-sourcemap-lookup <https://domain/path/to/js/file.js>:<line number>:<column number> [options]");

    console.log("");
    console.log("valid [options]:");
    console.log("\t-h, --help\t\t Show this help message.");
    console.log("\t-v, --version\t\t Show current version.");
    console.log("\t-A\t\t\t The number of lines to print after the target line. Default is 5.");
    console.log("\t-B\t\t\t The number of lines to print before the target line. Default is 5.");
    console.log("\t-C\t\t\t The number of lines to print before and after the target line. If supplied, -A and -B are ignored.");
    console.log("\t-s <sourcepath> \t Provide a path to the actual source files, this will be used to find the file to use when printing the lines from the source file. Default is ./");
    console.log("\t-m <source-map-url> \t Provide a URL to the actual source maps file, this will be used to lookup source maps. Default is the same as .js URL location. Example: http://domain/path/to/js/source/maps/\n\n");
    process.exit(0);
}

if (process.argv.length <= 2) {
    showHelp();
    return;
}

var argv = require('minimist')(process.argv.slice(2), {
    alias: {
        "h": "help",
        "v": "version",
        "s": "source-path"
    }
});

if (argv["help"]) {
    showHelp();
    return;
}

if (argv["version"]) {
    console.log("");
    console.log("online-sourcemap-lookup v" + require("./package.json").version);
    console.log("\tby Jernej Gololicic<jernej.gololicic@gmail.com> © 2019");
    console.log("");
    return;
}

var source = argv._[0].split(":");
var col = parseInt(source.pop());
var line = parseInt(source.pop());
var url = source.join(":");


if (url.indexOf('.js') === -1 || isNaN(line) || isNaN(col)) {
    showHelp();
    process.exit(0);
}

var sourceDirectory = argv["source-path"] || "";
var linesBefore = parseInt(argv["C"] || argv["B"]) || 5;
var linesAfter = parseInt(argv["C"] || argv["A"]) || 5;

// make sure a string is always the same length
function pad(str, len) {
    str = str + "";
    while (str.length < len) {
        str = str + " ";
    }
    return str;
}

console.log("");
var fs = require("fs");
var sourceMap = require('source-map');
var https = require("https");

url = url.split('/');
var fileName = url.pop();
fileName += '.map';

var sourceMapsLocation = argv['m'] || url.join('/');
url = sourceMapsLocation + "/" +fileName;

console.log("Downloading sourcemap file from", url);
https.get(url, function (response) {
    var data = '';

    if (response.statusMessage !== "OK") {
        console.log('ERROR: ', response.statusCode, ' ', response.statusMessage);
        process.exit(1);
    }

    response.setEncoding('utf8');
    response.on('data', function (chunk) {
        data += chunk;
    });

    response.on('end', function () {

        var obj = JSON.parse(data);
        var smc = new sourceMap.SourceMapConsumer(obj);
        var originalPosition = smc.originalPositionFor({
            line: line,
            column: col
        });

        console.log("Original Position: \n\t" + originalPosition.source + ", Line " + originalPosition.line + ":" + originalPosition.column);
        console.log("");

        // remove the webpack stuff and try to find the real file
        var originalFileName = (sourceDirectory + originalPosition.source).replace("webpack:///", "").replace("/~/", "/node_modules/").replace(/\?[0-9a-zA-Z\*\=]+$/, "");

        var sourceIndex = obj.sources.indexOf(originalFileName);

        if (sourceIndex !== -1) {
            showFileContent(obj.sourcesContent[sourceIndex]);
        } else {
            fs.access(originalFileName, fs.R_OK, function (err) {
                if (err) {
                    console.log("Unable to access source file, " + originalFileName);
                } else {
                    fs.readFile(originalFileName, function (err, data) {
                        if (err) throw err;

                        showFileContent(data.toString('utf-8'));
                    });
                }
            });
        }

        function showFileContent(content) {
            // Data is a buffer that we need to convert to a string
            // Improvement: loop over the buffer and stop when the line is reached
            var lines = content.split("\n");
            var line = originalPosition.line;
            if (line > lines.length) {
                console.log("Line " + line + " outside of file bounds (" + lines.length + " lines total).");
            } else {
                var minLine = Math.max(0, line - (linesBefore + 1));
                var maxLine = Math.min(lines.length, line + linesAfter);
                var code = lines.slice(minLine, maxLine);
                console.log("Code Section: ");
                var padLength = Math.max(("" + minLine).length, ("" + maxLine).length) + 1;


                function formatLineNumber(currentLine) {
                    if (currentLine == line) {
                        return (pad(currentLine, padLength - 1) + ">| ").bold.red;
                    } else {
                        return pad(currentLine, padLength) + "| ";
                    }
                }

                var currentLine = minLine;
                for (var i = 0; i < code.length; i++) {
                    console.log(formatLineNumber(++currentLine) + code[i]);
                    if (currentLine == line && originalPosition.column) {
                        console.log(pad('', padLength + 2 + originalPosition.column) + '^'.bold.red);
                    }
                }
            }

            console.log("\n");
        }
    });
});

