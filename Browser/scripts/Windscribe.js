//Dedicated imports 
import { config } from "dotenv";
config( {path: `../../Configs/.env.client` });
import cmd from 'node-cmd';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));
import log from './functions.js';
import sqlite3 from 'better-sqlite3';
//let DBSOURCE = `../${process.env.PathToDB}`;
let DBSOURCE = process.env.PathToDB;
let db = new sqlite3(DBSOURCE, {});


//#region VPN 
export class VPN {
    // DON'T USE 2+ EXEMPLARS OF THIS CLASSES AT THE SAME TIME
    // Foolproof is to be added in this class in the future
    constructor(specID) {
        this._specID = specID;
    }
    async initiate() {
        //Default disconnect just in case
        await this.VPNDisable();
        //Define if there's passed VPN, define it in the case of absence
        if ((this._specID == undefined) || (this._specID == null) || (this._specID == "")) {
            this._specID = this.VPNConfDefine();
        }
        //Enable VPN
        let res = await this.VPNEnable(await this.SQL_VPN_Conf(this._specID), this._specID);
        //Proceed result
        if (res == "Success") {
            log(`Successfully executed: ${this._specID}`, 'done');
            return "Success"
        } else {
            log(`Executed with a code: ${res}`, 'err');
            return "Failed"
        }
    }
    VPNConfDefine() {
        //Extract number of active configs
        let sql = `SELECT COUNT (*) from [Windscribe];`;
        var params = [];
        let result;
        try {
            result = db.prepare(sql).all();
            result = result[0]['COUNT (*)'];
            log(`Configs in DB: ${result}`, 'info');
        } catch (error) {
            log(error, 'err');
            throw new Error("ShutDown");
        }
        //RND   
        let min = Math.ceil(1);
        let max = Math.floor(result);
        let tbr = Math.floor(Math.random() * (max - min + 1)) + min;
        log(`Selected cfg #${tbr}`, "info");
        return tbr
    }
    SQL_VPN_Conf(specID) {
        let sql = `SELECT * from [Windscribe] WHERE Id=${specID};`;
        let result;
        try {
            result = db.prepare(sql).all();
            log(`Successfuly extracted: ${specID}`, 'info');
        } catch (error) {
            log(error, 'err');
            throw new Error("ShutDown");
        }
        return result
    }
    async VPNEnable(configFile, specID) {
        configFile = configFile[0];
        log(`VPN details - Name: ${configFile.Name} - Config: ${configFile.Config}`, "info");
        let m = cmd.runSync(
            `"${process.env.PathToWindscribe}" connect ${configFile.Config}`
        );
        if (m.err) {
            log(m.err, 'err');
            return "Failed";
        }
        log(`Connect: ${m.data.split("\n")[0]}`, 'info');
        log(`Setting Timeout ${process.env.CMD_WS_Post_Timeout}`, 'info');
        await this.sleep(Number(process.env.CMD_WS_Post_Timeout));
        log(`Exiting Timeout ${process.env.CMD_WS_Post_Timeout}`, 'info');
        return "Success";
    }
    async VPNDisable() {
        let m = cmd.runSync(
            `"${process.env.PathToWindscribe}" disconnect`
        );
        if (m.err) {
            log(m.err, 'err');
            return "Failed";
        }
        log(`Disconnect: ${m.data.split("\n")[0]}`, 'info');
        let tiOut = Math.abs(Number(process.env.CMD_WS_Post_Timeout) - 3000);
        log(`Setting Timeout ${tiOut}`, 'info');
        await this.sleep(Number(tiOut));
        log(`Exiting Timeout ${tiOut}`, 'info');
        return "Success";
    }
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    get ActiveConf() {
        return this._specID;
    }
}
//#endregion