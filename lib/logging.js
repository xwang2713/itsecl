#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Logger = (function () {
    function Logger() {
    }
    Logger.onVerbose = function () {
        Logger.log = function () {
            var msgs = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                msgs[_i] = arguments[_i];
            }
            process.stderr.write("KERNEL: ");
            console.error(msgs.join(" "));
        };
    };
    Logger.onProcessDebug = function () {
        try {
            var debugging_1 = require("debug")("KERNEL:");
            Logger.log = function () {
                var msgs = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    msgs[_i] = arguments[_i];
                }
                debugging_1(msgs.join(" "));
            };
        }
        catch (err) {
            Logger.onVerbose();
        }
    };
    Logger.throwAndExit = function () {
        var msgs = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            msgs[_i] = arguments[_i];
        }
        console.error(msgs.join(" "));
        Logger.printUsage();
        process.exit(1);
    };
    Logger.printUsage = function () {
        console.error(Logger.usage);
    };
    Logger.usage = "\nUsage: node kernel.js [--debug] [--hide-undefined] [--protocol=Major[.minor[.patch]]] [--session-working-dir=path] [--show-undefined] [--startup-script=path] connection_file\n";
    Logger.log = function () {
    };
    return Logger;
}());
exports.Logger = Logger;
