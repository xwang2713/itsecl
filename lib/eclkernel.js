"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
    ECLExecutor.prototype.setConfig = function (code) {
    };
    /**
     * Check type of the task from code
     *
     * @param {String} code
     */
    ECLExecutor.prototype.taskType = function (code) {
        return "JS";
    };
    /**
     * HPCC Handler for 'execute_request' message
     *
     * code @param {module:jmp~Message} request Request message
     */
    ECLExecutor.prototype.execute_request = function (request) {
        return "OK";
    };
    return ECLExecutor;
}());
exports.ECLExecutor = ECLExecutor;
