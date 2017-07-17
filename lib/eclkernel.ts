#!/usr/bin/env node

/// <reference path="../typings/index.d.ts" />

import * as fs from "fs";
import { Workunit } from "@hpcc-js/comms";
import { WUAction } from "@hpcc-js/comms";

var log = (...msgs: any[]) => {
            //process.stderr.write("KERNEL: ");
            console.error("ECL-KERNEL: " + msgs.join(" "));
        };


export interface ESPConfig {
    // ESP server ip address
    ip: string;

    // ESP port. The default is ECLWatch port 8010
    port: number;

    // HPCC cluster. The default is hthor
    cluster: string;

    // ESP user name
    user: string;

    // ESP user password
    password: string;
}

/**
 * @class 
 * @classdesc Implements HPCC ESP Connection and ECL code submittion for JS-ECL kernel 
 */
export class ECLExecutor  {

     protected ip: string  = "localhost"; 
     protected port: number = 8010; 
     protected cluster: string  = "hthor"; 
     protected user: string = ""; 
     protected password: string = ""; 
     protected defaultTask: string = "ECL"; 


     get config(): ESPConfig {
         let espConfig: ESPConfig = {
             ip:       this.ip,
             port:     this.port,
             cluster:  this.cluster,
             user:     this.user,
             password: this.password
         };
         return espConfig;
     }

     getValue(str:string, key:string): string {
         let re = new RegExp(key + "\s*=\s*[^;]*;", 'i');
         let match = str.match(re);
         if (match != null) {
             return match[0].split('=')[1].replace(";", "").trim();
         }
         return "";
     }

     setConfig(code: string) {
         let match = code.match(/^\s*\/\/CONN.*\n/i);
         if (match == null) {
             return;
         }
         let line = match[0];
         if (line.search("file\s*=")) {
            let file = this.getValue(line, "file");
            this.getConfigFromFile(file);
         }
         this.getConfigFromString(line);

         if (line.search(/^\s*\/\/CONN\s* default.*\n/i) >= 0) {
             this. defaultTask = "CONN";
         } else if (line.search(/^\s*\/\/JS\s* default.*\n/i) >= 0 ) {
             this.defaultTask = "JS";
         } else if (line.search(/^\s*\/\/ECL\s* default.*\n/i) >= 0) {
             this.defaultTask = "ECL";
         }
     }

     getConfigFromString(str: string): void {
         if (str.search("ip\s*=") >= 0) {
             this.ip = this.getValue(str, "ip");
         }
         if (str.search("port\s*=") >= 0) {
             this.port = Number(this.getValue(str, "port"));
         }
         if (str.search("cluster\s*=") >=0 ) {
             this.cluster = this.getValue(str, "cluster");
         }
         if (str.search("default\s*=") >= 0) {
             this.defaultTask = this.getValue(str, "default");
         }
         if (str.search("user\s*=") >=0) {
             this.user = this.getValue(str, "user");
         }
         if (str.search("password\s*=") >=0) {
             this.password = this.getValue(str, "password");
         }
     }

     getConfigFromFile(file:string): void {
         if (fs.existsSync(file)) {
             let content =   fs.readFileSync(file, 'utf8');
             let str = content.replace(/\n/g, ";").replace(/\r/g, "").replace(/;\s*;/g, ";");
             this.getConfigFromString(str);
         }
     }


    /**
     * Check type of the task from code
     * 
     * @param {String} code 
     */
    taskType(code: string): string {
        //log(code);
        if (code.search(/^\s*\/\/CONN/i) >= 0) {
           return "CONN";
        } else if (code.search(/^\s*\/\/ECL/i) >= 0) {
           return "ECL";
        } else if (code.search(/^\s*\/\/JS/i) >= 0) {
           return "JS";
        } else {
           return this.defaultTask;
        }
    }

    logConfig(): void {
       log("ip="+this.ip + " port=" + this.port + " cluster=" + this.cluster + 
           " user=" + this.user + " password=" + this.password + " default=" + this.defaultTask);
    }

    execute_ecl(code: string): Promise<WUAction.Response> {
        let ESP_URL = "http://" + this.ip + ":" + this.port;
        return Workunit.submit({ baseUrl: ESP_URL, userID: this.user, password: this.password }, this.cluster, code).then((wu) => {
            return wu.watchUntilComplete();
        }).then((wu) => {
            return wu.fetchResults().then((results) => {
                return results[0].fetchRows();
            }).then((rows) => {
                //  Do Dtuff With Results !!!
                return wu;
            });
        }).then((wu) => {
             return wu.delete();
        });
    }

    /**
     * HPCC Handler for 'execute_request' message
     * 
     * code @param {module:jmp~Message} request Request message
     */
    execute_request(base: any, request: any) {
        let task_type = this.taskType(request.content.code);
        let code = request.content.code;
        if (task_type == "CONN")  {
           // parse code to get espConfig
           this.setConfig(code);
           this.logConfig();
           //construct code for connection test
           code = "'Hello and Welcome';"; 
        } else { // ECL
           // remove "//ECL" from request.code
           code = code.replace(/^\s*\/\/ECL[^\n]*\n/, "");
                      
        }

        this.beforeRun(base, request);
        //call  sumbit_ecl
        let ecl_result = this.execute_ecl(code);
        log("ecl result: " + ecl_result);
        //create result
        let result = { mime: { 'text/plain': '\'Task type: ' + task_type + '\'' } };
        this.onSuccess(base, request, result);
        this.afterRun(base, request);

    }

    status_busy(base: any, request: any) {
        request.respond(base.iopubSocket, 'status', {
            execution_state: 'busy'
        });
    }


    status_idle(base: any, request: any) {
       request.respond(base.iopubSocket, 'status', {
          execution_state: 'idle'
       });
    }



    beforeRun(base: any, request: any) {
        this.status_busy(base, request);

        base.executionCount++;

        request.respond(
            base.iopubSocket,
            "execute_input", {
                execution_count: base.executionCount,
                code: request.content.code,
            }
        );
    }

    afterRun(base: any, request: any ) {
        this.status_idle(base, request);
    }

    onSuccess(base: any, request: any, result: any) {
        request.respond(
            base.shellSocket,
            "execute_reply", {
                status: "ok",
                execution_count: base.executionCount,
                payload: [], // TODO(NR) not implemented,
                user_expressions: {}, // TODO(NR) not implemented,
            }
        );

        if (!result.mime) {
            return;
        }

        if (base.hideUndefined &&
            result.mime["text/plain"] === "undefined") {
            return;
        }

        request.respond(
            base.iopubSocket,
            "execute_result", {
                execution_count: base.executionCount,
                data: result.mime,
                metadata: {},
            }
        );
    }

    onError(base: any, request: any, result: any) {
        request.respond(
            base.shellSocket,
            "execute_reply", {
                status: "error",
                execution_count: base.executionCount,
                ename: result.error.ename,
                evalue: result.error.evalue,
                traceback: result.error.traceback,
            }
        );

        request.respond(
            base.iopubSocket,
            "error", {
                execution_count: base.executionCount,
                ename: result.error.ename,
                evalue: result.error.evalue,
                traceback: result.error.traceback,
            }
        );
    }

}
