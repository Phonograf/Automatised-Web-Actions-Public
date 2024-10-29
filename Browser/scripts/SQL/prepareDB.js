import log from '../functions.js';

export function prepareDB(db){
    let sql = `CREATE TABLE IF NOT EXISTS [Mainframe] (
            Id INTEGER PRIMARY KEY AUTOINCREMENT,
            Nickname text, 
            Email text, 
            Password text,
            RelativeStorage text,
            IncidentLog TEXT,
            Refferer TEXT,
            Target TEXT,
            Created Integer,
            Plan TEXT,
            CreateTime DATE, 
            ToBeRevisited Integer,
            StayTime Integer,            
            DateLastChanged DATE,    
            DateToCreate DATE,
            DateCreated DATE,
            VPNreferenc TEXT,
            raw text
            )`;
    db.prepare(sql).run();
    sql = `CREATE TABLE IF NOT EXISTS [VPN] (
            Id INTEGER PRIMARY KEY AUTOINCREMENT,
            Name text, 
            Location text, 
            Config text,
            raw text
            )`;
    db.prepare(sql).run();
    sql = `CREATE TABLE IF NOT EXISTS [Windscribe] (
            Id INTEGER PRIMARY KEY AUTOINCREMENT,
            Name text, 
            Location text, 
            Config text,
            raw text
            )`;
    db.prepare(sql).run();
    log('Database validated','info')
}