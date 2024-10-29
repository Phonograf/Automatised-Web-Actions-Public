const express = require('express'), bodyParser = require('body-parser');
var http = require('http');
const https = require('https');
const fs = require('fs');
const app = express();
const TechCFG = require('../Configs/Backend.json');
require("dotenv").config({ path: `../Configs/.env.key` });
const port = TechCFG.mainport;
var sqlite3 = require('sqlite3').verbose()
const cors = require('cors');
var jwt = require('jsonwebtoken');
var bcrypt = require('bcryptjs');
const DBSOURCE = TechCFG.DBSOURCE;
const auth = require("./middleware.js");
const Permissions = require("./permission.js");
var main = require('./routes/main.js');
let clients = require('./routes/clients.js');
var cookieParser = require('cookie-parser');
let morgan = require('morgan');
let rfs = require('rotating-file-stream');
const path = require("path");

let db = new sqlite3.Database(DBSOURCE, (err) => {
    if (err) {
      // Cannot open database
      console.error(err.message);
      throw err
    } 
    else {        
        db.run(`CREATE TABLE Users (
            Id INTEGER PRIMARY KEY AUTOINCREMENT,
            Username text, 
            Email text, 
            Password text,             
            Salt text,    
            Token text,
            DateLoggedIn DATE,
            DateCreated DATE,
            GFX text,
            raw text
            )`,
        (err) => {
            if (err) {
                // Table already created
            } else{
                // Table just created, creating some rows
                var salt = bcrypt.genSaltSync(10);

                var data = {
                    Username: "admin",
                    Email: "admin@admin.com",
                    Password: bcrypt.hashSync("admin!", salt),
                    Salt: salt,
                    DateCreated: Date('now')
                }
        
                var sql ='INSERT INTO Users (Username, Email, Password, Salt, DateCreated,raw) VALUES (?,?,?,?,?,?)'
                var params =[data.Username, data.Email, data.Password, data.Salt, Date('now'),'admin']
                var user = db.run(sql, params, function (err, innerResult) {
                    if (err){
                        console.log(err);
                        return;
                    }
                  
                });
            }
        });  

        db.run(`CREATE TABLE Notifications (
            Id INTEGER PRIMARY KEY AUTOINCREMENT,
            Code TEXT,
            Message TEXT,
            Status TEXT,
            Target TEXT,
            DateOfInit DATE,
            DateOfExpire DATE
            )`,
        (err) => {
            if (err) {
                // Table already created
            } else{
                // Table just created, creating some rows
                // placeholder for the default rows
            }
        });
    }
});


module.exports = db

var accessLogStream = rfs.createStream(`access.log`, {
    interval: '1d', // rotate 
    path: path.join(__dirname, 'log')
  });
var accessLogStr = rfs.createStream(`important.log`, {
    interval: '1d', // rotate 
    path: path.join(__dirname, 'log')
})

app.all('/', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    next();
   });

app.use(
    express.static('static'),
    cookieParser(),
    express.static(path.join(__dirname, 'client')),
    express.urlencoded(),
    bodyParser.json(),
    cors({
        origin: '*',
        maxAge: 6000
    })
);
app.use(morgan('common', { stream: accessLogStream }));
app.use(morgan('combined', { stream: accessLogStr,skip: function (req, res) { return res.statusCode < 400 } }));
app.use("/main", main);
app.use("/clients", clients);

app.get('/', (req, res) => res.send('API Root'));


// * SYSTEM NOTIFICATIONS
app.get("/api/notifications", auth, (req, res, next) => {
    var sql = `SELECT * FROM Notifications WHERE DateOfExpire>${Date.now()}`
    var params = []
    db.all(sql, params, (err, rows) => {
        if (err) {
          res.status(400).json({"error":err.message});
          return;
        }
        res.json({
            "message":"success",
            "data":rows
        })
      });
});

app.post("/api/newnotification", auth,Permissions(["ManageNotifications"]), (req, res, next) => {
    //:3004/main/
    try {
        let body = req.body;
        let sql = `INSERT INTO Notifications (Code, Message, Status, Target, DateOfInit, DateOfExpire) VALUES (${body.Code+","+body.Message+","+body.Status+","+body.Target+","+body.DateOfInit+","+body.DateOfExpire})`;
        var params = [];
        db.all(sql, params, (err, rows) => {
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


app.get("/api/deletenotification/:id", auth,Permissions(["ManageNotifications"]), (req, res, next) => {
    var sql = "DELETE from Notifications WHERE Id = ?"
    db.all(sql, req.params.id, (err, rows) => {
        if (err) {
          res.status(400).json({"error":err.message});
          return;
        }
        res.json({
            "message":`Deleted ${req.params.id}`,
            "data":rows
        })
      });
});

app.get("/logs/", auth,Permissions(["admin"]), (req, res, next) => {
    fs.readFile('./log/important.log', 'utf8', function(err, data){ 
      res.status(200).send(data)
    }); 
});
app.get("/logs/download", auth,Permissions(["admin"]), (req, res, next) => {
    res.status(200).sendFile('/root/API/bs-tournament-data-analytic-tool/client-component/API/log/access.log');
});


// * R E G I S T E R   N E W   U S E R

app.post("/api/register",auth,Permissions(["RegisterUsers"]), async (req, res) => { //auth,Permissions(["RegisterUsers"]),
    var errors=[]
    try {
        const { Username, Email, Password } = req.body;

        if (!Username){
            errors.push("Username is missing");
        }
        if (!Email){
            errors.push("Email is missing");
        }
        if (errors.length){
            res.status(400).json({"error":errors.join(",")});
            return;
        }
        let userExists = false;
        
        
        var sql = "SELECT * FROM Users WHERE Email = ?"        
        await db.all(sql, Email, (err, result) => {
            if (err) {
                res.status(402).json({"error":err.message});
                return;
            }
            
            if(result.length === 0) {                
                
                var salt = bcrypt.genSaltSync(10);

                var data = {
                    Username: Username,
                    Email: Email,
                    Password: bcrypt.hashSync(Password, salt),
                    Salt: salt,
                    DateCreated: Date('now')
                }
        
                var sql ='INSERT INTO Users (Username, Email, Password, Salt, DateCreated) VALUES (?,?,?,?,?)'
                var params =[data.Username, data.Email, data.Password, data.Salt, Date('now')]
                var user = db.run(sql, params, function (err, innerResult) {
                    if (err){
                        res.status(400).json({"error": err.message})
                        return;
                    }
                  
                });           
            }            
            else {
                userExists = true;
                res.status(404).send("User Already Exist. Please Login");  
            }
        });
  
        setTimeout(() => {
            if(!userExists) {
                res.status(201).json("Success");    
            } else {
                res.status(201).json("Record already exists. Please login");    
            }            
        }, 500);


    } catch (err) {
      console.log(err);
    }
})


// * L O G I N

app.post("/api/login", async (req, res) => {
  console.log(req.body)
  try {      
    const { Email, Password } = req.body;
        // Make sure there is an Email and Password in the request
        if (!(Email && Password)) {
            res.status(400).send("All input is required");
        }
            
        let user = [];
        
        var sql = "SELECT * FROM Users WHERE Email = ?";
        db.all(sql, Email, function(err, rows) {
            try {
                rows.forEach(function (row) {
                    user.push(row);                
                })
                
                var PHash = bcrypt.hashSync(Password, user[0].Salt);
           
                if(PHash === user[0].Password) {
                    // * CREATE JWT TOKEN
                    const token = jwt.sign(
                        { user_id: user[0].Id, username: user[0].Username,permissions:user[0].raw, Email },
                          process.env.TOKEN_KEY,
                        {
                          expiresIn: "3h", // 60s = 60 seconds - (60m = 60 minutes, 2h = 2 hours, 2d = 2 days)
                        }  
                    );
    
                    user[0].Token = token;
    
                } else {
                    return res.status(400).send("No Match");          
                }
                let options = {
                    path:"/",
                    sameSite:"none",
                    secure:true,
                    expires: new Date(Date.now() + (3*3600 * 1000)),
                    httpOnly: false,
                }
                res.status(200);
               res.setHeader("Content-Type", "application/x-www-form-urlencoded");
               //res.setHeader("Access-Control-Allow-Credentials", true);
               res.cookie('x-access-token',user[0].Token, options);
               return res.send(`${user[0].Token}`);  
               //return res.redirect('/');        
            } catch (error) {
                console.log(error);
                res.status(500).send("Error");
            }
                  
        });	
    
    } catch (err) {
      console.log(err);
    }    
});

  
// * T E S T  

app.post("/api/test", auth, (req, res) => {
    res.setHeader("Content-Type", "application/x-www-form-urlencoded");
    res.status(200).send(req.user);
});

//*  G E T   A L L

app.get("/api/users", auth, (req, res, next) => {
    var sql = "SELECT Id,Username FROM Users"
    var params = []
    db.all(sql, params, (err, rows) => {
        if (err) {
          res.status(400).json({"error":err.message});
          return;
        }
        res.json({
            "message":"success",
            "data":rows
        })
      });
});


//* G E T   S I N G L E   U S E R

app.get("/api/user/:id", auth, (req, res, next) => {
    var sql = "SELECT Id,Username FROM Users WHERE Id = ?"
    db.all(sql, req.params.id, (err, rows) => {
        if (err) {
          res.status(400).json({"error":err.message});
          return;
        }
        res.json({
            "message":"success",
            "data":rows
        })
      });
});

app.get("/api/userSp/:id", auth, Permissions(["ManageRoles"]), (req, res, next) => {
    var sql = "SELECT * FROM Users WHERE Id = ?"
    db.all(sql, req.params.id, (err, rows) => {
        if (err) {
          res.status(400).json({"error":err.message});
          return;
        }
        res.json({
            "message":"success",
            "data":rows
        })
      });
});

app.post("/api/user/update/:id", auth, (req, res, next) => {
    console.log(`Id =${req.params.id}`);
    if (req.user.user_id !=req.params.id) {
        if (req.user.permissions.indexOf("admin")==-1) {
            res.status(403).json({"error":"No Permissions"});
            return;
        }
    }
    try {
        let sql = `UPDATE Users Set Username = "${req.body.name}" WHERE Id ="${req.params.id}"`;
        var params = [];
        db.all(sql, params, (err, rows) => {
        if (err) {
            console.log(err);
          return;
        }
      });
    } catch (error) {
        console.log(error);
    }
    try {
        let sql = `UPDATE Users Set Email = "${req.body.mail}" WHERE Id ="${req.params.id}"`;
        var params = [];
        db.all(sql, params, (err, rows) => {
        if (err) {
            console.log(err);
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

app.post("/api/user/updatePerms/:id",auth,Permissions(["ManageRoles"]),  (req, res, next) => {//
    console.log(`Id =${req.params.id}`)
    try {
        let sql = `UPDATE Users Set raw = "${req.body.name}" WHERE Id ="${req.params.id}"`;
        var params = [];
        db.all(sql, params, (err, rows) => {
        if (err) {
            console.log(err);
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
    }
});

var httpServer = http.createServer(app);
var httpsServer;
try {
    const options = {
        cert: fs.readFileSync(TechCFG.PathToCERT),
        key: fs.readFileSync(TechCFG.PathToKEY)
    };
    httpsServer = https.createServer(options, app);
    console.log(`API HTTPS listening on port ${port}!`);
    httpsServer.listen(port); 
} catch (error) {
    console.log(`https client faied: ${error}`);
}
httpServer.listen(TechCFG.reserveport);
console.log(`API HTTP listening on port ${TechCFG.reserveport}!`);
