#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var comms_1 = require("@hpcc-js/comms");
//import { WUAction } from "@hpcc-js/comms";
var logging_1 = require("./logging");
var util = require("util");
var ECLResult = (function () {
    function ECLResult() {
        this.mime = {};
        this.error = { ename: "", evalue: "", traceback: "" };
    }
    ECLResult.prototype.renderInHtml = function (rows) {
        if (rows.length == 0) {
            this.mime['text/html'] = "No Result";
            return;
        }
        var htmlTable = "<table style=\"border:1px; cellspacing:0; cellpadding:0; width: 100%; text-align:left\">\n";
        htmlTable = htmlTable + "<tr><th>##</th>";
        for (var k in rows[0]) {
            htmlTable = htmlTable + "<th>" + k.trim() + "</th>";
        }
        htmlTable = htmlTable + "</tr>\n";
        for (var i = 0; i < rows.length; i++) {
            htmlTable = htmlTable + "<tr><td>" + (i + 1) + "</td>";
            for (var k in rows[i]) {
                var v = rows[i][k];
                //if (typeof (v) == "string" ) {
                //    v = v.trim();
                //}
                htmlTable = htmlTable + "<td>" + v + "</td>";
            }
            htmlTable = htmlTable + "</tr>\n";
        }
        htmlTable = htmlTable + "</table>";
        this.mime['text/html'] = htmlTable;
    };
    ECLResult.prototype.setError = function (e) {
        this.error.ename = (e && e.name) ? e.name : typeof e;
        this.error.evalue = (e && e.message) ? e.message : util.inspect(e);
        this.error.traceback = (e && e.stack) ? e.stack.split("\n") : "";
    };
    return ECLResult;
}());
exports.ECLResult = ECLResult;
/**
 * @class
 * @classdesc Implements HPCC ESP Connection and ECL code submittion for JS-ECL kernel
 */
var ECLExecutor = (function () {
    function ECLExecutor() {
        this.ip = "localhost";
        this.port = 8010;
        this.cluster = "hthor";
        this.user = "";
        this.password = "";
        this.defaultTask = "ECL";
        this.configFile = "";
        this.eclResult = new ECLResult();
    }
    Object.defineProperty(ECLExecutor.prototype, "config", {
        get: function () {
            var espConfig = {
                ip: this.ip,
                port: this.port,
                cluster: this.cluster,
                user: this.user,
                password: this.password
            };
            return espConfig;
        },
        enumerable: true,
        configurable: true
    });
    ECLExecutor.prototype.getValue = function (str, key) {
        var re = new RegExp(key + "\s*=\s*[^;]*;", 'i');
        var match = str.match(re);
        if (match != null) {
            return match[0].split('=')[1].replace(";", "").trim();
        }
        return "";
    };
    ECLExecutor.prototype.setConfig = function (code) {
        var match = code.match(/^\s*\/\/CONN.*/i);
        if (match == null) {
            return;
        }
        var line = match[0];
        if (line.search("file\s*=")) {
            var file = this.getValue(line, "file");
            this.getConfigFromFile(file);
        }
        this.getConfigFromString(line);
        if (line.search(/^\s*\/\/CONN\s* default.*/i) >= 0) {
            this.defaultTask = "CONN";
        }
        else if (line.search(/^\s*\/\/JS\s* default.*/i) >= 0) {
            this.defaultTask = "JS";
        }
        else if (line.search(/^\s*\/\/ECL\s* default.*/i) >= 0) {
            this.defaultTask = "ECL";
        }
    };
    ECLExecutor.prototype.getConfigFromString = function (str) {
        if (str.search("ip\s*=") >= 0) {
            this.ip = this.getValue(str, "ip");
        }
        if (str.search("port\s*=") >= 0) {
            this.port = Number(this.getValue(str, "port"));
        }
        if (str.search("cluster\s*=") >= 0) {
            this.cluster = this.getValue(str, "cluster");
        }
        if (str.search("default\s*=") >= 0) {
            this.defaultTask = this.getValue(str, "default");
        }
        if (str.search("user\s*=") >= 0) {
            this.user = this.getValue(str, "user");
        }
        if (str.search("password\s*=") >= 0) {
            this.password = this.getValue(str, "password");
        }
    };
    ECLExecutor.prototype.getConfigFromFile = function (file) {
        if (fs.existsSync(file)) {
            var content = fs.readFileSync(file, 'utf8');
            var str = content.replace(/\n/g, ";").replace(/\r/g, "").replace(/;\s*;/g, ";");
            this.getConfigFromString(str);
        }
    };
    /**
     * Check type of the task from code
     *
     * @param {String} code
     */
    ECLExecutor.prototype.taskType = function (code) {
        if (code.search(/^\s*\/\/CONN/i) >= 0) {
            return "CONN";
        }
        else if (code.search(/^\s*\/\/ECL/i) >= 0) {
            return "ECL";
        }
        else if (code.search(/^\s*\/\/JS/i) >= 0) {
            return "JS";
        }
        else if (code.search(/^\s*\/\/CONF/i) >= 0) {
            return "CONF";
        }
        else {
            return this.defaultTask;
        }
    };
    /**
     * HPCC Handler for 'execute_request' message
     *
     * code @param {module:jmp~Message} request Request message
     */
    ECLExecutor.prototype.execute_request = function (base, request) {
        var task_type = this.taskType(request.content.code);
        var code = request.content.code;
        if (task_type == "CONN") {
            // parse code to get espConfig
            this.setConfig(code);
            //construct code for connection test
            code = "'Connection with HPCC ESP server succeed';";
        }
        else {
            if (code.search(/^\s*\/\/ECL\s* cluster.*/i) >= 0) {
                this.cluster = this.getValue(code, "cluster");
            }
            // remove "//ECL" from request.code
            code = code.replace(/^\s*\/\/ECL[^\n]*\n/, "");
        }
        this.beforeRun(base, request);
        if (task_type == "CONF") {
            var configStr = "ip=" + this.ip + " port=" + this.port + " cluster=" + this.cluster +
                " user=" + this.user + " default=" + this.defaultTask;
            var result = { mime: { 'text/plain': '\'Config: ' + configStr + '\'' } };
            this.onSuccess(base, request, result);
            this.afterRun(base, request);
            return;
        }
        var ESP_URL = "http://" + this.ip + ":" + this.port;
        var executor = this;
        logging_1.Logger.log("ESP_URL: " + ESP_URL);
        logging_1.Logger.log("code: " + code);
        comms_1.Workunit.submit({ baseUrl: ESP_URL, userID: this.user, password: this.password }, this.cluster, code).then(function (wu) {
            return wu.watchUntilComplete();
        }).then(function (wu) {
            return wu.fetchResults().then(function (results) {
                return results[0].fetchRows();
            }).then(function (rows) {
                //  Do Dtuff With Results !!!
                if (task_type == "CONN") {
                    executor.eclResult.mime = { 'text/plain': rows[0]['Result_1'] };
                }
                else {
                    //executor.eclResult.mime = {'text/plain': 'ECL'};
                    executor.eclResult.renderInHtml(rows);
                }
                executor.onSuccess(base, request, executor.eclResult);
                executor.afterRun(base, request);
                return wu;
            });
        }).then(function (wu) {
            if (task_type == "CONN") {
                return wu.delete();
            }
        }).catch(function (e) {
            console.log("catch error");
            console.log(e);
            executor.eclResult.setError(e);
            executor.onError(base, request, executor.eclResult);
        });
    };
    ECLExecutor.prototype.status_busy = function (base, request) {
        request.respond(base.iopubSocket, 'status', {
            execution_state: 'busy'
        });
    };
    ECLExecutor.prototype.status_idle = function (base, request) {
        request.respond(base.iopubSocket, 'status', {
            execution_state: 'idle'
        });
    };
    ECLExecutor.prototype.beforeRun = function (base, request) {
        this.status_busy(base, request);
        base.executionCount++;
        request.respond(base.iopubSocket, "execute_input", {
            execution_count: base.executionCount,
            code: request.content.code,
        });
    };
    ECLExecutor.prototype.afterRun = function (base, request) {
        this.status_idle(base, request);
    };
    ECLExecutor.prototype.onSuccess = function (base, request, result) {
        request.respond(base.shellSocket, "execute_reply", {
            status: "ok",
            execution_count: base.executionCount,
            payload: [],
            user_expressions: {},
        });
        if (!result.mime) {
            return;
        }
        if (base.hideUndefined &&
            result.mime["text/plain"] === "undefined") {
            return;
        }
        request.respond(base.iopubSocket, "execute_result", {
            execution_count: base.executionCount,
            data: result.mime,
            metadata: {},
        });
    };
    ECLExecutor.prototype.onError = function (base, request, result) {
        request.respond(base.shellSocket, "execute_reply", {
            status: "error",
            execution_count: base.executionCount,
            ename: result.error.ename,
            evalue: result.error.evalue,
            traceback: result.error.traceback,
        });
        request.respond(base.iopubSocket, "error", {
            execution_count: base.executionCount,
            ename: result.error.ename,
            evalue: result.error.evalue,
            traceback: result.error.traceback,
        });
    };
    return ECLExecutor;
}());
exports.ECLExecutor = ECLExecutor;
