#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var child_process_1 = require("child_process");
var fs = require("fs");
var os = require("os");
var path = require("path");
var uuid = require("uuid");
// Setup logging helpers
var Logger = (function () {
    function Logger() {
    }
    Logger.onVerbose = function () {
        Logger.log = function () {
            var msgs = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                msgs[_i] = arguments[_i];
            }
            process.stderr.write("ITS: ");
            console.error(msgs.join(" "));
        };
    };
    Logger.onProcessDebug = function () {
        try {
            var debugging_1 = require("debug")("ITS:");
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
    Logger.throwAndExit = function (printUsage, printContext) {
        var msgs = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            msgs[_i - 2] = arguments[_i];
        }
        console.error(msgs.join(" "));
        if (printUsage) {
            Logger.printUsage();
        }
        if (printContext) {
            Logger.printContext();
        }
        process.exit(1);
    };
    Logger.printUsage = function () {
        console.error(Logger.usage);
    };
    Logger.printContext = function () {
        Logger.log(Path.toString());
        Logger.log(Arguments.toString());
        Logger.log(Flags.toString());
        Logger.log(Protocol.toString());
        Logger.log(Frontend.toString());
    };
    Logger.usage = "ITSECL Notebook\n\nUsage:\n  itsecl <options>\n\nThe recognized options are:\n  --help                        show ITSECL & notebook help\n  --ts-debug                    enable debug log level\n  --ts-help                     show ITSECL help\n  --ts-hide-undefined           do not show undefined results\n  --ts-install=[local|global]   install ITSECL kernel\n  --ts-protocol=version         set protocol version, e.g. 4.1\n  --ts-show-undefined           show undefined results\n  --ts-startup-script=path      run script on startup\n                                (path can be a file or a folder)\n  --ts-working-dir=path         set session working directory\n                                (default = current working directory)\n  --version                     show ITSECL version\n\nand any other options recognized by the Jupyter notebook; run:\n\n  jupyter notebook --help\n\nfor a full list.\n\nDisclaimer:\n  ITSECL notebook and itsecl kernel are modified version of IJavascript notebook and itsecl kernels.\n  Copyrights of original codes/algorithms belong to IJavascript developers.\n";
    Logger.log = function () {
    };
    return Logger;
}());
var Path = (function () {
    function Path() {
    }
    Path.toString = function () {
        return "\n        PATH: [node: \"" + Path._node + "\", root: \"" + Path._root + "\"]";
    };
    Path.at = function () {
        var rest = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            rest[_i] = arguments[_i];
        }
        return path.join.apply(path, [Path._root].concat(rest));
    };
    Object.defineProperty(Path, "node", {
        get: function () {
            return Path._node;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Path, "kernel", {
        get: function () {
            return Path.at("lib", "kernel.js");
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Path, "images", {
        get: function () {
            return Path.at("images");
        },
        enumerable: true,
        configurable: true
    });
    Path._node = process.argv[0];
    Path._root = path.dirname(path.dirname(fs.realpathSync(process.argv[1])));
    return Path;
}());
var InstallLoc;
(function (InstallLoc) {
    InstallLoc[InstallLoc["local"] = 0] = "local";
    InstallLoc[InstallLoc["global"] = 1] = "global";
})(InstallLoc || (InstallLoc = {}));
var Flags = (function () {
    function Flags() {
    }
    Flags.toString = function () {
        return "\n        FLAG: [debug? " + (Flags.debug ? "on" : "off") + ", \n               installAt: \"" + Flags.install + "\",\n               startupScript: \"" + Flags.startup + "\",\n               workingDirectory: \"" + Flags.cwd + "\"]";
    };
    Flags.onDebug = function () {
        Flags.debug = true;
    };
    Object.defineProperty(Flags, "installAt", {
        set: function (flag) {
            var loc = InstallLoc[flag];
            if (!loc) {
                Logger.throwAndExit(true, false, "Invalid flag for install location", flag);
            }
            Flags.install = loc;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Flags, "startUpScript", {
        set: function (script) {
            Flags.startup = script;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Flags, "workingDir", {
        set: function (loc) {
            Flags.cwd = loc;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Flags, "startScript", {
        get: function () {
            return Flags.startup;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Flags, "working", {
        get: function () {
            return Flags.cwd;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Flags, "installPath", {
        get: function () {
            return Flags.install;
        },
        enumerable: true,
        configurable: true
    });
    Flags.debug = false;
    return Flags;
}());
/**
 * @property {String[]} context.args.kernel   Command arguments to run kernel
 * @property {String[]} context.args.frontend Command arguments to run frontend
 **/
var Arguments = (function () {
    function Arguments() {
    }
    Arguments.toString = function () {
        return "\n        KernelArgs: [" + Arguments._kernel.join(",") + "],\n        FrontendArgs: [" + Arguments._frontend.join(",") + "]";
    };
    Object.defineProperty(Arguments, "kernel", {
        get: function () {
            return Arguments._kernel;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Arguments, "frontend", {
        get: function () {
            return Arguments._frontend;
        },
        enumerable: true,
        configurable: true
    });
    Arguments.passToKernel = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        Arguments._kernel.push(args.join("="));
    };
    Arguments.passToFrontend = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        Arguments._frontend.push(args.join("="));
    };
    Arguments.callFrontendWith = function (path) {
        Arguments._frontend[0] = path;
    };
    Arguments._kernel = [
        Path.node,
        Path.kernel
    ];
    Arguments._frontend = [
        "jupyter",
        "notebook",
    ];
    return Arguments;
}());
var Protocol = (function () {
    function Protocol() {
    }
    Protocol.toString = function () {
        return "\n        PROTOCOL: version " + Protocol._version;
    };
    Object.defineProperty(Protocol, "version", {
        get: function () {
            Protocol.setup();
            return Protocol._version;
        },
        set: function (ver) {
            Protocol._version = ver;
            Protocol._majorVersion = parseInt(ver.split(".", 1)[0]);
        },
        enumerable: true,
        configurable: true
    });
    Protocol.setup = function () {
        if (!Protocol._version) {
            if (Frontend.majorVersion < 3) {
                Protocol.version = "4.1";
            }
            else {
                Protocol.version = "5.0";
            }
        }
    };
    Object.defineProperty(Protocol, "majorVersion", {
        get: function () {
            Protocol.setup();
            return Protocol._majorVersion;
        },
        enumerable: true,
        configurable: true
    });
    return Protocol;
}());
var Frontend = (function () {
    function Frontend() {
    }
    Frontend.toString = function () {
        return "\n        FRONTEND: version " + Frontend._version + "\n                  error: " + (Frontend.error ? Frontend.error : "NO ERROR");
    };
    Object.defineProperty(Frontend, "version", {
        get: function () {
            return Frontend._version;
        },
        set: function (ver) {
            Frontend._version = ver;
            Frontend._majorVersion = parseInt(ver.split(".")[0]);
            if (isNaN(Frontend.majorVersion)) {
                Logger.throwAndExit(false, true, "Error parsing Jupyter/Ipython version:", ver);
            }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Frontend, "majorVersion", {
        get: function () {
            return Frontend._majorVersion;
        },
        enumerable: true,
        configurable: true
    });
    return Frontend;
}());
var Main = (function () {
    function Main() {
    }
    Main.prepare = function (callback) {
        var extraArgs = process.argv.slice(2);
        for (var _i = 0, extraArgs_1 = extraArgs; _i < extraArgs_1.length; _i++) {
            var e = extraArgs_1[_i];
            var _a = e.slice(2).split("="), name_1 = _a[0], values = _a.slice(1);
            if (name_1.lastIndexOf("ts", 0) === 0) {
                var subname = name_1.slice(3);
                switch (subname) {
                    case "debug":
                        Logger.onVerbose();
                        Flags.onDebug();
                        Arguments.passToKernel("--debug");
                        break;
                    case "hide-undefined":
                    case "show-undefined":
                        Arguments.passToKernel("--" + subname);
                        break;
                    case "help":
                        Logger.printUsage();
                        process.exit(0);
                        break;
                    case "install":
                        Flags.installAt = values[0];
                        break;
                    case "install-kernel":
                        Flags.installAt = "local";
                        break;
                    case "protocol":
                        Protocol.version = values[0];
                        break;
                    case "startup-script":
                        Flags.startUpScript = values.join("=");
                        break;
                    case "working-dir":
                        Flags.workingDir = values.join("=");
                        break;
                    default:
                        Logger.throwAndExit(true, false, "Unknown flag", e);
                }
            }
            else {
                switch (name_1) {
                    case "help":
                        Logger.printUsage();
                        Arguments.passToFrontend(e);
                        break;
                    case "version":
                        console.log(Main.packageJSON.version);
                        process.exit(0);
                        break;
                    case "KernelManager.kernel_cmd":
                        console.warn("Warning: Flag \"" + e + "\" skipped");
                        break;
                    default:
                        Arguments.passToFrontend(e);
                }
            }
        }
        if (Flags.startScript) {
            Arguments.passToKernel("--startup-script", Flags.startScript);
        }
        if (Flags.working) {
            Arguments.passToKernel("--session-working-dir", Flags.working);
        }
        Arguments.passToKernel("{connection_file}");
        if (callback) {
            callback();
        }
    };
    Main.setProtocol = function () {
        Arguments.passToKernel("--protocol", Protocol.version);
        if (Frontend.majorVersion < 3) {
            Arguments.passToFrontend("--KernelManager.kernel_cmd", "['" + Arguments.kernel.join("', '") + "']");
        }
        if (Frontend.majorVersion < 3 &&
            Protocol.majorVersion >= 5) {
            console.warn("Warning: Protocol v5+ requires Jupyter v3+");
        }
    };
    Main.setJupyterInfoAsync = function (callback) {
        child_process_1.exec("jupyter --version", function (error, stdout) {
            if (error) {
                Frontend.error = error;
                Main.setIPythonInfoAsync(callback);
                return;
            }
            Arguments.callFrontendWith("jupyter");
            Frontend.version = stdout.toString().trim();
            if (callback) {
                callback();
            }
        });
    };
    Main.setIPythonInfoAsync = function (callback) {
        child_process_1.exec("ipython --version", function (error, stdout) {
            if (error) {
                if (Frontend.error) {
                    console.error("Error running `jupyter --version`");
                    console.error(Frontend.error.toString());
                }
                Logger.throwAndExit(false, true, "Error running `ipython --version`\n", error.toString());
            }
            Arguments.callFrontendWith("ipython");
            Frontend.version = stdout.toString().trim();
            if (callback) {
                callback();
            }
        });
    };
    Main.makeTmpdir = function (maxAttempts) {
        if (maxAttempts === void 0) { maxAttempts = 10; }
        var attempts = 0;
        var tmpdir;
        while (!tmpdir) {
            attempts++;
            try {
                tmpdir = path.join(os.tmpdir(), uuid.v4());
                fs.mkdirSync(tmpdir);
            }
            catch (e) {
                if (attempts >= maxAttempts) {
                    Logger.throwAndExit(false, false, "Cannot make a temp directory!");
                }
                tmpdir = null;
            }
        }
        return tmpdir;
    };
    Main.copyAsync = function (srcDir, dstDir, callback) {
        var images = [];
        for (var _i = 3; _i < arguments.length; _i++) {
            images[_i - 3] = arguments[_i];
        }
        var dstFiles = [];
        var callStack = [];
        if (callback) {
            callStack.push(function () {
                callback.apply(void 0, dstFiles);
            });
        }
        var _loop_1 = function (img) {
            var src = path.join(srcDir, img);
            var dst = path.join(dstDir, img);
            dstFiles.push(dst);
            callStack.push(function () {
                var readStream = fs.createReadStream(src);
                var writeStream = fs.createWriteStream(dst);
                readStream.on("end", function () {
                    var top = callStack.pop();
                    top();
                });
                readStream.pipe(writeStream);
            });
        };
        for (var _a = 0, images_1 = images; _a < images_1.length; _a++) {
            var img = images_1[_a];
            _loop_1(img);
        }
        var top = callStack.pop();
        top();
    };
    Main.installKernelAsync = function (callback) {
        if (Frontend.majorVersion < 3) {
            if (Flags.installPath) {
                console.error("Error: Installation of kernel specs requires Jupyter v3+");
            }
            if (callback) {
                callback();
            }
            return;
        }
        // Create temporary spec folder
        var tmpdir = Main.makeTmpdir();
        var specDir = path.join(tmpdir, "tsecl");
        fs.mkdirSync(specDir);
        // Create spec file
        var specFile = path.join(specDir, "kernel.json");
        var spec = {
            argv: Arguments.kernel,
            display_name: "TSECL " + require("typescript").version.replace(/([0-9]+\.[0-9]+)\..*/g, "$1"),
            language: "typescript",
        };
        fs.writeFileSync(specFile, JSON.stringify(spec));
        // Copy logo files
        var logoDir = path.join(Path.images);
        Main.copyAsync(logoDir, specDir, function () {
            var dstFiles = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                dstFiles[_i] = arguments[_i];
            }
            // Install kernel spec
            var args = [
                Arguments.frontend[0],
                "kernelspec install --replace",
                specDir,
            ];
            if (Flags.installPath !== InstallLoc.global) {
                args.push("--user");
            }
            var cmd = args.join(" ");
            child_process_1.exec(cmd, function (error, stdout, stderr) {
                // Remove temporary spec folder
                fs.unlinkSync(specFile);
                for (var _i = 0, dstFiles_1 = dstFiles; _i < dstFiles_1.length; _i++) {
                    var file = dstFiles_1[_i];
                    fs.unlinkSync(file);
                }
                fs.rmdirSync(specDir);
                fs.rmdirSync(tmpdir);
                if (error) {
                    Logger.throwAndExit(false, true, "Error running \"" + cmd + "\"\n", error.toString(), "\n", stderr ? stderr.toString() : "");
                }
                if (callback) {
                    callback();
                }
            });
        }, "logo-32x32.png", "logo-64x64.png");
    };
    Main.spawnFrontend = function () {
        var _a = Arguments.frontend, cmd = _a[0], args = _a.slice(1);
        var frontend = child_process_1.spawn(cmd, args, {
            stdio: "inherit"
        });
        // Relay SIGINT onto the frontend
        var signal = "SIGINT";
        process.on(signal, function () {
            frontend.emit(signal);
        });
    };
    Main.packageJSON = JSON.parse(fs.readFileSync(Path.at("package.json")).toString());
    return Main;
}());
if (process.env["DEBUG"]) {
    Logger.onProcessDebug();
}
Main.prepare(function () {
    Main.setJupyterInfoAsync(function () {
        Main.setProtocol();
        Main.installKernelAsync(function () {
            Logger.printContext();
            if (!Flags.installPath) {
                Main.spawnFrontend();
            }
        });
    });
});
