let TechCFG = require('../Configs/SQLDatabase.json');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const port = TechCFG.port;
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require("path");

const cors = require('cors');
let rfs = require('rotating-file-stream');
let morgan = require('morgan');
var sqlite3 = require('better-sqlite3');

const auth = require("./middleware");

//init database
const DBSOURCE = TechCFG.DBSOURCE;

let db = new sqlite3(DBSOURCE, {}, (err) => {
  if (err) {
    // Cannot open database
    console.error(err.message);
    throw err
  }
  db.run(`CREATE TABLE IF NOT EXISTS [Mainframe] (
            Id INTEGER PRIMARY KEY AUTOINCREMENT,
            PassTo Integer,
            Nickname text, 
            Email text, 
            Password text,
            RelativeStorage text,
            IncidentLog TEXT,
            Refferer TEXT,
            Target TEXT,
            Created Integer,
            CreateTime DATE, 
            ToBeRevisited Integer,
            StayTime Integer,            
            DateLastChanged DATE,    
            DateToCreate DATE,
            DateCreated DATE,
            Plan TEXT,
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
});
//init bodyparser
app.use(bodyParser.json());


// init Logs

var accessLogStr = rfs.createStream(`important.log`, {
  interval: '3d', // rotate 
  path: path.join(__dirname, 'log')
});
var accessLogStream = rfs.createStream(`access.log`, {
  interval: '1d', // rotate 
  path: path.join(__dirname, 'log')
});
app.use(morgan('common', { stream: accessLogStream }));
app.use(morgan('combined', { stream: accessLogStr, skip: function (req, res) { return res.statusCode < 400 } }));

//Init CORS (restricted localhost)

var corsOptions = {
  origin: function (origin, callback) {
    console.log(`origin: ${origin}`);
    if (TechCFG.acceptRestricted) {
      if (TechCFG.whitelist.indexOf(origin) !== -1) {
        callback(null, true)
      } else {
        callback(new Error('Not allowed by CORS'))
      }
    }
  },
  maxAge: 10000
}
app.use(
  cors(corsOptions)
);

//REST
/*ROUTES MAP:
|- /status  - Provides status of the module
|- /logs
    |- /important - Access with error codes
    |- /regular - All accesses
|- /get - for SELECTS
|- /update - for updating data
|- /insert - for adding new data
|- /raw - flexible requests
*/

app.get('/status', auth, (req, res) => {
  res.send('Online');
})

app.get("/logs/important", auth, (req, res, next) => {
  fs.readFile('./log/important.log', 'utf8', function (err, data) {
    res.status(200).send(data)
  });
});

app.get("/logs/regular", auth, (req, res, next) => {
  fs.readFile('./log/access.log', 'utf8', function (err, data) {
    res.status(200).send(data)
  });
});

app.get("/get", auth, (req, res, next) => {
  try {
    let sql = `select * from [Mainframe] where Id>=? ORDER BY Id DESC LIMIT ?;`
    var params = [req.query.params.offset, req.query.params.limit];
    console.log(sql);
    db.all(sql, params, (err, rows) => {
      if (err) {
        res.status(400).json({ "error": err.message });
        return;
      }
      res.setHeader("Content-Type", "application/json");
      res.json({
        "message": "success",
        "data": rows
      })
    });
  } catch (error) {
    console.log(error);
    res.status(503);
  }
});

app.post("/raw", auth, (req, res, next) => {
  try {
    console.log(req.body); //Losing req.body
    let sql = req.body.sql || req.headers.sql;
    var params = [];
    db.all(sql, params, (err, rows) => {
      if (err) {
        res.status(400).json({ "error": err.message });
        return;
      }
      res.setHeader("Content-Type", "application/json");
      res.json({
        "message": "success",
        "data": rows
      })
    });
  } catch (error) {
    console.log(error);
    res.status(503);
  }
});

app.post("/insert", auth, (req, res, next) => {
  try {
    let temp = req.query.params;
    let sql = `INSERT INTO [Mainframe] (PassTo, Nickname, Email, Password, Refferer, Target, Created, CreateTime, ToBeRevisited, DateLastChanged, DateToCreate, DateCreated, VPNreferenc, Plan) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?);`
    let params = [
      temp.PassTo || 1,
      temp.Nickname || null,
      temp.Email || null,
      temp.Password || null,
      temp.Refferer || "https://google.com",
      temp.Target || "https://discord.com",
      temp.Created || 0,
      temp.CreateTime || Date.now() + 20000,
      temp.ToBeRevisited || "false",
      Date.now(),
      Date.now(),
      temp.VPNreferenc || null,
      temp.Plan || null
    ];
    console.log(sql);
    db.all(sql, params, (err, rows) => {
      if (err) {
        res.status(400).json({ "error": err.message });
        return;
      }
      res.setHeader("Content-Type", "application/json");
      res.json({
        "message": "success",
        "data": rows
      })
    });
  } catch (error) {
    console.log(error);
    res.status(503);
  }
});

app.listen(port, () => {
  console.log(`App listening on port ${port}`)
})