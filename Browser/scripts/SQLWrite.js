import { config } from "dotenv";
config();
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
    db.run(`CREATE TABLE VPN (
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

//#region Storing results
export async function SQLWriteSignUp(params) {
    let DC ="";
    if (params.CreateTime) {
        DC = `CreateTime=${params.CreateTime},`
    }
    //format string
    params = {
        Id: params.Id || 0,
        RelativeStorage: params.Id || 0,
        IncidentLog: params.IncidentLog || "",
        Created: params.Created || 1,
        CreateTime: Date.now(),
        StayTime: params.StayTime || 0,
        DateLastChanged: Date.now(),
        VPNreferenc: params.VPNreferenc
    }
    let sql = `UPDATE [Mainframe] set
    RelativeStorage=${params.RelativeStorage},
    IncidentLog='${params.IncidentLog}',
    Created=${params.Created},
    StayTime=${params.StayTime},
    DateLastChanged=${params.DateLastChanged},
    ${DC}
    VPNreferenc=${params.VPNreferenc}
    Where Id=${params.Id};`
    //console.log(sql);
    let result;
    try {
        result = db.prepare(sql).run();
        log(`Successfuly stored: ${params.Id}`, 'info');
    } catch (error) {
        log(error, 'err');
    }
}
//#endregion

