import { Workunit } from "@hpcc-js/comms";

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

     setConfig(code: string) {
     }

    /**
     * Check type of the task from code
     * 
     * @param {String} code 
     */
    taskType(code: string): string {
        return "JS";
    }

    /**
     * HPCC Handler for 'execute_request' message
     * 
     * code @param {module:jmp~Message} request Request message
     */
    execute_request(request: any): string {
        return "OK";
    }
}
