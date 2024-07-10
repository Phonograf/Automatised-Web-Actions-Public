import { config } from "dotenv";
config();
import cmd from 'node-cmd';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));
import log from './functions.js';
import sqlite3 from 'better-sqlite3';
//let DBSOURCE = `../${process.env.PathToDB}`;
let DBSOURCE = process.env.PathToDB;
let db = new sqlite3(DBSOURCE, {}, (err) => {
    if (err) {
        // Cannot open database
        console.error(err.message);
        throw err
    }
    db.run(`CREATE TABLE Mainframe (
            Id INTEGER PRIMARY KEY AUTOINCREMENT,
            Nickname text, 
            Email text, 
            Password text,
            RelativeStorage text,
            IncidentLog TEXT,
            Refferer TEXT,
            Created Integer,
            CreateTime DATE, 
            ToBeRevisited Integer,
            StayTime Integer,            
            DateLastChanged DATE,    
            DateToCreate DATE,
            DateCreated DATE,
            VPNreferenc TEXT,
            raw text
            )`,
        (err) => {
            if (err) {
                // Table already created
            } else {
                // Table just created, creating some rows
            }
        });
    db.run(`CREATE TABLE Windscribe (
            Id INTEGER PRIMARY KEY AUTOINCREMENT,
            Name text, 
            Location text, 
            Config text,
            raw text
            )`,
        (err) => {
            if (err) {
                // Table already created
            } else {
                // Table just created, creating some rows
            }
        });
});


//#region VPN 
export class VPN {
    // DON'T USE 2+ EXEMPLARS OF THIS CLASSES AT THE SAME TIME
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
        /*Deprecated
        let result = db.all(sql, params, (err, rows) => {
            if (err) {
                log(err, 'err');
                return;
            }
            log(`Number of VPN configs: ${user.nickname}`, 'info');
            return rows.Config;
        });
        */
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
        var params = [];/*DEPRECATED
        let result = db.all(sql, params, (err, rows) => {
            if (err) {
                log(err, 'err');
                return;
            }
            log(`Successfuly extracted data about VPN config: ${user.nickname}`, 'done');
            return rows.Config;
        });*/
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
        cmd.runSync(
            `"${process.env.PathToWindscribe}" connect ${configFile.Config}`,
            function (err, data, stderr) {
                if (err) {
                    log(err, 'err');
                    return "Failed";
                }
            }
        );
        log(`CMD Connection command was executed`, 'info');
        log(`Setting Timeout ${process.env.CMD_WS_Post_Timeout}`, 'info');
        await this.sleep(Number(process.env.CMD_WS_Post_Timeout));
        log(`Exiting Timeout ${process.env.CMD_WS_Post_Timeout}`, 'info');
        return "Success";
    }
    async VPNDisable() {
        cmd.runSync(
            `"${process.env.PathToWindscribe}" disconnect`,
            function (err, data, stderr) {
                if (err) {
                    log(err, 'err');
                    return "Failed";
                }
            }
        );
        log(`CMD Disconnection command was executed`, 'info');
        let tiOut = Math.abs(Number(process.env.CMD_WS_Post_Timeout)-5000);
        log(`Setting Timeout ${tiOut}`, 'nifo');
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