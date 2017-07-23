#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var path = require("path");
var ts = require("typescript");
var logging_1 = require("./logging");
var eclkernel_1 = require("./eclkernel");
var Kernel = require("jpecl-kernel");
var vm = require("vm");
var Configuration = (function () {
    function Configuration() {
        this._onDebug = false;
        this._workingDir = process.cwd();
        this.hideUndefined = false;
        this.protocolVer = "5.0";
        this.onStartup = function () {
            var tscode = fs.readFileSync(path.join(__dirname, "startup.ts")).toString();
            var code = ts.transpile(tscode, {});
            this.session.execute(code, {
                onSuccess: function () {
                    logging_1.Logger.log("startupCallback: \"startup.ts\" run successfuly");
                },
                onError: function () {
                    logging_1.Logger.log("startupCallback: \"startup.ts\" failed to run");
                },
            });
        };
        this.isConnSet = false;
        this.conn = {};
        this.eclExecutor = new eclkernel_1.ECLExecutor();
    }
    Object.defineProperty(Configuration.prototype, "config", {
        get: function () {
            var baseObj = {
                cwd: this._workingDir,
                hideUndefined: this.hideUndefined,
                protocolVersion: this.protocolVer,
                startupCallback: this.onStartup,
                debug: this._onDebug,
                kernelInfoReply: this.response,
                startupScript: this._startupScript,
                eclExecutor: this.eclExecutor,
                transpile: function (code) {
                    return ts.transpile(code, {});
                }
            };
            if (this.isConnSet) {
                baseObj.connection = this.conn;
            }
            else {
                logging_1.Logger.throwAndExit("Error: missing {connectionFile}");
            }
            if (this._startupScript) {
                baseObj.startupScript = this._startupScript;
            }
            return baseObj;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Configuration.prototype, "connectionWith", {
        set: function (path) {
            if (this.isConnSet) {
                logging_1.Logger.throwAndExit("Error: {connectionFile} cannot be duplicated");
            }
            this.isConnSet = true;
            this.conn = JSON.parse(fs.readFileSync(path).toString());
        },
        enumerable: true,
        configurable: true
    });
    Configuration.prototype.onDebug = function () {
        this._onDebug = true;
    };
    Configuration.prototype.hideUndef = function () {
        this.hideUndefined = true;
    };
    Configuration.prototype.showUndef = function () {
        this.hideUndefined = true;
    };
    Object.defineProperty(Configuration.prototype, "workingDir", {
        set: function (path) {
            this._workingDir = path;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Configuration.prototype, "protocolVersion", {
        set: function (ver) {
            this.protocolVer = ver;
            var majorVersion = parseInt(ver.split(".")[0]);
            if (majorVersion <= 4) {
                var tsVersion = ts.version.split(".")
                    .map(function (v) {
                    return parseInt(v, 10);
                });
                var protocolVersion = ver.split(".")
                    .map(function (v) {
                    return parseInt(v, 10);
                });
                this.response = {
                    "language": "typescript",
                    "language_version": tsVersion,
                    "protocol_version": protocolVersion,
                };
            }
            else {
                var itseclVersion = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "package.json")).toString()).version;
                this.response = {
                    "protocol_version": ver,
                    "implementation": "tsecl",
                    "implementation_version": itseclVersion,
                    "language_info": {
                        "name": "typescript",
                        "version": ts.version,
                        "mimetype": "text/x-typescript",
                        "file_extension": ".ts"
                    },
                    "banner": ("ITSECL v" + itseclVersion + "\n" +
                        "https://github.com/xwang2713/itsecl\n"),
                    "help_links": [{
                            "text": "TypeScript Doc",
                            "url": "http://typescriptlang.org/docs/",
                        }],
                };
            }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Configuration.prototype, "startupScript", {
        set: function (script) {
            this._startupScript = script;
        },
        enumerable: true,
        configurable: true
    });
    return Configuration;
}());
var Parser = (function () {
    function Parser() {
    }
    Parser.parse = function () {
        var configBuilder = new Configuration();
        var argv = process.argv.slice(2);
        for (var _i = 0, argv_1 = argv; _i < argv_1.length; _i++) {
            var arg = argv_1[_i];
            var _a = arg.slice(2).split("="), name_1 = _a[0], values = _a.slice(1);
            switch (name_1) {
                case "debug":
                    configBuilder.onDebug();
                    logging_1.Logger.onVerbose();
                    break;
                case "hide-undefined":
                    configBuilder.hideUndef();
                    break;
                case "protocol":
                    configBuilder.protocolVersion = values.join("=");
                    break;
                case "session-working-dir":
                    configBuilder.workingDir = values.join("=");
                    break;
                case "show-undefined":
                    configBuilder.showUndef();
                    break;
                case "startup-script":
                    configBuilder.startupScript = values.join("=");
                    break;
                default:
                    configBuilder.connectionWith = arg;
                    break;
            }
        }
        return configBuilder.config;
    };
    return Parser;
}());
if (process.env["DEBUG"]) {
    logging_1.Logger.onProcessDebug();
}
var config = Parser.parse();
// Start kernel
var kernel = new Kernel(config);
// WORKAROUND: Fixes https://github.com/n-riesco/ijavascript/issues/97
kernel.handlers.is_complete_request = function is_complete_request(request) {
    request.respond(this.iopubSocket, 'status', {
        execution_state: 'busy'
    });
    var content;
    try {
        new vm.Script(request.content.code);
        content = {
            status: "complete",
        };
    }
    catch (err) {
        content = {
            status: "incomplete",
            indent: "",
        };
    }
    request.respond(this.shellSocket, "is_complete_reply", content, {}, this.protocolVersion);
    request.respond(this.iopubSocket, 'status', {
        execution_state: 'idle'
    });
};
// Interpret a SIGINT signal as a request to interrupt the kernel
process.on("SIGINT", function () {
    logging_1.Logger.log("Interrupting kernel");
    kernel.restart(); // TODO(NR) Implement kernel interruption
});
