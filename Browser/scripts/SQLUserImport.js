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

//#region SQL User Extraction
//TBC
export async function SQLUserExtraction(id) {
    log(`Extracting user data: ${id}`, 'info');
    let sql = `SELECT * from [Mainframe] WHERE Id=${id};`;
    var params = [];
    //Deprecated
    /*db.all(sql, params, (err, rows) => {
        if (err) {
            log(err, 'err');
            return;
        }
        log(`Successfuly extracted: ${user.nickname}`, 'done');
        user = rows;
    });*/
    let user;
    try {
        user = db.prepare(sql).all();
        log(`Successfuly extracted: ${user[0].Nickname}`, 'done');
    } catch (error) {
        log(error, 'err');
        throw new Error("ShutDown");
    }
    return user
}


//#endregion
