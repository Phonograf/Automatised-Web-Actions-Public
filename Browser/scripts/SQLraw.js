import { config } from "dotenv";
config();
import log from './functions.js';
import sqlite3 from 'better-sqlite3';
let DBSOURCE = process.env.PathToDB;
let db = new sqlite3(DBSOURCE, {}, (err) => {
    if (err) {
        // Cannot open database
        console.error(err.message);
        throw err
    }
});

//#region SQL User Extraction
//TBC
export async function SQLRaw(sql) {
    log(`Writing raw SQL: ${sql}`, 'info');
    let res;
    try {
        res = db.prepare(sql).all();
        log(`Successfuly executed`, 'done');
    } catch (error) {
        log(error, 'err');
        throw new Error("ShutDown");
    }
    return res
}


//#endregion
