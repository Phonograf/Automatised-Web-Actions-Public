const express = require('express'), bodyParser = require('body-parser');
var router = express.Router();
const auth = require(".././middleware");
const Permissions = require(".././permission.js");
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
var sqlite3 = require('sqlite3').verbose();

require("dotenv").config();
let WebSocketServer = require("ws").Server;

let reestr =[];

// middleware that is specific to this router
router.use(function timeLog(req, res, next) {
  console.log('Time: ', Date.now());
  console.log(fetch);
  next();
});

let wss = new WebSocketServer({port:3010});

console.log(wss.address());

wss.on('connection', function connection(ws) {
    ws.on('error', console.error);
    ws.on('message', function message(data) {
    try {
        data = JSON.parse(data);
    } catch (error) {
        return
    }
      if (data.action=="greetings") {
        //create object from class
        if (data.password!='FF15ItIsGG') {
            console.log("security alert");
            return
        }
        console.log(`${data.iterations} - iter`);
        if (data.iterations==0) {
            reestr.push(new computer(data.data.name, data.data.comment,ws,data.data.ip));
            reestr[reestr.length-1].init();
        }else{
            let b = 0;
            for (let index = 0; index < reestr.length; index++) {
                try {
                    if ((reestr[index].name==data.data.name)&&(reestr[index].ip==data.data.ip) ){
                        reestr[index].UPDws(ws);
                        index = reestr.length;
                        b=1;
                    } 
                } catch (error) {
                    console.log(error.message);
                }
                
            }
            if (b==0) {
                reestr.push(new computer(data.data.name, data.data.comment,ws,data.data.ip));
                reestr[reestr.length-1].init();
            }
        }
        
      }
    });
    ws.on('close',function remover() {
        for (let index = 0; index < reestr.length; index++) {
            try {
                console.log(`id - ${reestr[index].id}; st - ${reestr[index].status}`)
                if((reestr[index].status==2)||(reestr[index].status==3)){
                    //reestr.slice(index,index+1);
                    reestr[index].status;
                }
            } catch (error) {
                console.log(error);
            }
            
        }
    })
  });

router.get("/websocket/all", auth, Permissions(["DOTA"]), (req, res, next) => {
    res.json({
        "message":"success",
        "data":reestr
    })
});

router.get("/websocket/:id",auth, Permissions(["DOTA"]),(req, res, next) => {
    let element = reestr[req.params.id];
    if (element==undefined) {
        res.sendStatus(500);
        return
    }
    res.json({
        "message":"success",
        "data":{
            name:element.name,
            comment:element.comment,
            ip:element.ip,
            status:element.status,
            log:element.log,
            gameStatus:element.gameStatus,
            time:element.gameTimeSaved
        }
    })
});

router.post("/websocket/echo/:id", auth,Permissions(["DOTA"]), (req, res, next) => {
    console.log(`Id =${req.params.id}`);
    let element = reestr[req.params.id];
    if (element==undefined) {
        res.sendStatus(500);
        return
    }
    try {
        res.json({
            "message":"success",
            "data":reestr[req.params.id].echo(req.body.content)
        })
    } catch (error) {
        res.status(503);
        return
    }
});

router.post("/websocket/dm/:id", auth,Permissions(["DOTA"]), (req, res, next) => {
    console.log(`Id =${req.params.id}`);
    let element = reestr[req.params.id];
    if (element==undefined) {
        res.sendStatus(500);
        return
    }
    try {
        res.json({
            "message":"success",
            "data":reestr[req.params.id].DM(req.body.content)
        })
    } catch (error) {
        res.status(503);
        return
    }
});

router.get("/websocket/log/:id", auth,Permissions(["DOTA"]), (req, res, next) => {
    console.log(`Id =${req.params.id}`);
    let element = reestr[req.params.id];
    if (element==undefined) {
        res.sendStatus(500);
        return
    }
    try {
        res.json({
            "message":"success",
            "data":reestr[req.params.id].log
        })
    } catch (error) {
        res.status(503);
        return
    }
});

router.get("/websocket/delete/:id", auth,Permissions(["DOTA"]), (req, res, next) => {
    console.log(`Id =${req.params.id}`);
    let element = reestr[req.params.id];
    if (element==undefined) {
        res.sendStatus(500);
        return
    }
    try {
        reestr[req.params.id]._socket.close();
        delete reestr[req.params.id];
        res.json({
            "message":"success",
            "data":0
        })
    } catch (error) {
        res.status(503);
        return
    }
});

router.get("/websocket/roster/:id", auth,Permissions(["DOTA"]), (req, res, next) => {
    console.log(`Id =${req.params.id}`);
    let element = reestr[req.params.id];
    if (element==undefined) {
        res.sendStatus(500);
        return
    }
    try {
        res.json({
            "message":"success",
            "data":reestr[req.params.id].rosterInfo
        })
    } catch (error) {
        res.status(503);
        return
    }
});

class computer {
    constructor(name, comment, socket,ip) {
        this._comment = comment; this._name = name; 
        this._socket = socket;
        this._id = reestr.length;
        this._ip = ip;
        this._log = "";
        this._status = 0;
        this._gameStatus = "NotDefined";
        this._gameTimeSaved = "00:00";
        this._rosterInfo = {};
      }
    get name() {
        return this._name;
    }
    get ip() {
        return this._ip;
    }
    get comment() {
        return this._comment;
    }
    get id() {
        return this._id;
    }
    get status(){
        this._status = this._socket.readyState;
        return this._socket.readyState;
    }
    get log(){
        return this._log;
    }
    get gameStatus(){
      return this._gameStatus;
  }
  get gameTimeSaved(){
    return this._gameTimeSaved;
}
    get rosterInfo(){
        return this._rosterInfo;
    }
    echo(data){
        let status = 1;
        try {
            const Message = {action:"ECHO","data":data}
            this._socket.send(JSON.stringify(Message));
        } catch (error) {
            console.log(error);
            return -1
        }
        return 0
    }
    listen(){
        let mes = this.message.bind(this);
        this._socket.on('message', mes);
    }
    message(data) {
        console.log('received: %s', data);
        console.log(this._id);
        if ((data.indexOf("crit!")!=-1)||(data.indexOf("warn!")!=-1)) {
          this._log+=data;
        }else if(data.indexOf("---")!=-1){
          let sp = data.split("---");
          this._gameStatus=sp[0];
          this._gameTimeSaved=sp[1];
        }else if((data.indexOf("RosterInfo")!=-1)){
            try {
                let dataa = JSON.parse(data);
                this._rosterInfo = dataa;
            } catch (error) {
                console.log("Could not understand roster - Not valud JSON");
            }
        }
        
      }
    init(){
        let fic = this.listen.bind(this);
        fic(this);
    }
    DM(data){
        try {
            const Message = {action:"DM","data":data}
            this._socket.send(JSON.stringify(Message));
        } catch (error) {
            console.log(error);
            return -1
        }
        return 0 
    }
    UPDws(ws){
        this._socket = ws;
        let mes = this.message.bind(this);
        this._socket.on('message', mes);
    }
}

module.exports = router;