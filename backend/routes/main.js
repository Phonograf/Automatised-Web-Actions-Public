const express = require('express'), bodyParser = require('body-parser');
var router = express.Router();
const auth = require(".././middleware");
const Permissions = require(".././permission.js");
var sqlite3 = require('sqlite3').verbose();
const DBSFTOURCE = "../../databases/faceitdb.sqlite";


    let dbf = new sqlite3.Database(DBSFTOURCE, (err) => {
        if (err) {
          // Cannot open database
          console.error(err.message)
          throw err
        } 
        else {        
            
            dbf.run(`CREATE TABLE championships (
                Id INTEGER PRIMARY KEY AUTOINCREMENT,
                Name text, 
                Link text, 
                Status text,             
                DateCreated DATE,
                raw text
                )`,
            (err) => {
                if (err) {
                    // Table already created
                } else{
                    // Table just created, creating some rows
                    //var insert = 'INSERT INTO Users (Username, Email, Password, Salt, DateCreated) VALUES (?,?,?,?,?)'
                    /*db.run(insert, ["Admin", "goloviznin.danya@yandex.com", bcrypt.hashSync("LongLiveFT", salt), salt, Date('now')])
                    db.run(insert, ["Phonograf", "phonograf@staff.eslgaming.com", bcrypt.hashSync("n1111pRBcdkk", salt), salt, Date('now')])
                    db.run(insert, ["test", "test@example.com", bcrypt.hashSync("testas123121", salt), salt, Date('now')])
                    db.run(insert, ["Techpriest", "p.djordjevic@efg.gg", bcrypt.hashSync("zDK4x2G6l7td12", salt), salt, Date('now')])*/
                }
            });  
            dbf.run(`CREATE TABLE logs (
                Id INTEGER PRIMARY KEY AUTOINCREMENT,
                match text, 
                LinkTM text, 
                Status text,
                InternalStatus text,             
                DateCreated DATE,
                raw text
                )`,
            (err) => {
                if (err) {
                    // Table already created
                } else{
                    // Table just created, creating some rows
                    //var insert = 'INSERT INTO Users (Username, Email, Password, Salt, DateCreated) VALUES (?,?,?,?,?)'
                    /*db.run(insert, ["Admin", "goloviznin.danya@yandex.com", bcrypt.hashSync("LongLiveFT", salt), salt, Date('now')])
                    db.run(insert, ["Phonograf", "phonograf@staff.eslgaming.com", bcrypt.hashSync("n1111pRBcdkk", salt), salt, Date('now')])
                    db.run(insert, ["test", "test@example.com", bcrypt.hashSync("testas123121", salt), salt, Date('now')])
                    db.run(insert, ["Techpriest", "p.djordjevic@efg.gg", bcrypt.hashSync("zDK4x2G6l7td12", salt), salt, Date('now')])*/
                }
            });  
        }
    });
    
module.exports = dbf


// middleware that is specific to this router
router.use(function timeLog(req, res, next) {
  console.log('Time: ', Date.now());
  next();
});

router.get("/ping", (req, res, next) => {
    //:3004/main/ping
    res.status(200).send('pong!');
});


router.post("/faceit/logs/raw", auth,Permissions(["SQL"]), (req, res, next) => {
    //:3004/main/
    try {
        let sql = req.body.sql;
        var params = [];
        dbf.all(sql, params, (err, rows) => {
        if (err) {
          res.status(400).json({"error":err.message});
          return;
        }
        res.setHeader("Content-Type", "application/json");
        res.json({
            "message":"success",
            "data":rows
        })
      });
    } catch (error) {
        console.log(error);
        res.status(503);
    }
});

router.get("/faceit/logs/all",auth, (req, res, next) => {
    //:3004/main/
    var sql = `SELECT * FROM logs where (raw is null) or (instr("${req.user.permissions}",raw)>0) or ("${req.user.permissions}" like "admin"))`
    var params = []
    dbf.all(sql, params, (err, rows) => {
        if (err) {
          res.status(400).json({"error":err.message});
          return;
        }
        res.setHeader("Content-Type", "application/json");
        res.json({
            "message":"success",
            "data":rows
        })
      });
});

router.get("/faceit/logs/recent",auth, (req, res, next) => {
    //:3004/main/
    var sql = `select *
    from [logs] f
    where (f.DateCreated > ${new Date(new Date()).getTime()-24*3600*1000}) and ((raw is null) or (instr("${req.user.permissions}",raw)>0) or ("${req.user.permissions}" like "admin")) ORDER BY Id DESC`;
    
    var params = []
    dbf.all(sql, params, (err, rows) => {
        if (err) {
          res.status(400).json({"error":err.message});
          return;
        }
        res.setHeader("Content-Type", "application/json");
        res.json({
            "message":"success",
            "data":rows
        })
      });
});

router.get("/faceit/logs/CountRecent",auth, (req, res, next) => {
    //:3004/main/
    var sql = `SELECT COUNT(DateCreated) FROM logs WHERE (DateCreated > ${new Date(new Date()).getTime()-24*3600*1000}) and ((raw is null) or (instr("${req.user.permissions}",raw)>0) or ("${req.user.permissions}" like "admin"))`;
    
    var params = []
    dbf.all(sql, params, (err, rows) => {
        if (err) {
          res.status(400).json({"error":err.message});
          return;
        }
        res.setHeader("Content-Type", "application/json");
        res.json({
            "message":"success",
            "data":rows
        })
      });
});

router.get("/faceit/logs/last",auth, (req, res, next) => {
    //:3004/main/
    var sql = `SELECT * FROM [logs] f where f.DateCreated > ${new Date(new Date()).getTime()-24*3600*1000} AND f.InternalStatus > 0  and ((raw is null) or (instr("${req.user.permissions}",raw)>0) or ("${req.user.permissions}" like "admin")) ORDER BY Id DESC LIMIT 6;`;
    
    var params = []
    dbf.all(sql, params, (err, rows) => {
        if (err) {
          res.status(400).json({"error":err.message});
          return;
        }
        res.setHeader("Content-Type", "application/json");
        res.json({
            "message":"success",
            "data":rows
        })
      });
});

router.get("/faceit/logs/last/count",auth, (req, res, next) => {
    //:3004/main/
    var sql = `SELECT COUNT(*) FROM [logs] f where f.DateCreated > ${new Date(new Date()).getTime()-24*3600*1000} AND f.InternalStatus > 1 and ((raw is null) or (raw like "${req.user.permissions}") or (raw like "admin")) ORDER BY Id DESC LIMIT 4;`;
    
    var params = []
    dbf.all(sql, params, (err, rows) => {
        if (err) {
          res.status(400).json({"error":err.message});
          return;
        }
        res.setHeader("Content-Type", "application/json");
        res.json({
            "message":"success",
            "data":rows
        })
      });
});

router.post("/mainframe/raw", auth,Permissions(["SQL"]),async function ll(req,res,next){
    try {
      let url = `http://localhost:58881/raw`;
      let sql = req.body.sql;
      console.log(sql);
      let token = `QW21312asd12fkmj`; //SECURITY ALERT! REPLACE IT WITH DOTENV
      let promiseA = await fetch(url, {
        method: "POST",
        mode: "cors",
        headers: {
          "Accept-Encoding": "gzip, deflate, br",
          "Accept": "accept",
          "Content-Type":"application/x-www-form-urlencoded",
          "Connection": "keep-alive",
          "Origin":"http://localhost:3000",
          "db-access-token": token,
          "sql":sql
        },
        body:`sql=${sql}`,
      }).then(response => { return response.text() }).then(dataB => { try { 
        console.log(dataB);
        let data = JSON.parse(dataB); console.log(data);
        res.setHeader("Content-Type", "application/json");
        res.status(200);
            res.json({
                "message":"success",
                "data":data
            })
      }
       catch (err) { res.status(412).send(err); } }).catch(err => res.status(504).send(err));
    } catch (error) {
      console.log(error);
      res.status(503).send(error);
    }
  });
  

module.exports = router;