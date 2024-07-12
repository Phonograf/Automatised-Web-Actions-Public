const WebSocket = require('ws');
const path = require('path');
var fs = require('fs');
const notifier = require('node-notifier');
var exec = require('child_process').exec;
var cmd=require('node-cmd');
require("dotenv").config();

let GlobalB;

let bool = 0;

//wsServer.on('connection', onConnect);
let ip = "?";
try {
    cmd.run(
        "ipconfig",
        function (err, data, stderr) {
            if(err){
                console.log(err);
                return;
            }
            try{
                ip = (data.split("IPv4-")[1].split(": ")[1].split("\n")[0]); 
            }catch(err){
                console.log("IP retry");
                try {
                    ip = (data.split("IPv4")[1].split(": ")[1].split("\n")[0]); 
                } catch (error) {
                    console.log("IP Failed");
                }
                
            }
            console.log(ip);
        }
    );
} catch (error) {
    console.log("IP Failed");
}
console.log(`ini cfg = ${process.env.npm_config_iter}; param - ${process.argv[2]}`)
let iter =  process.env.npm_config_iter || process.argv[2] || 0;
console.log(`ini iter = ${iter}`);
let wsClient = new WebSocket('wss://dota.tool.phonograf.site/socket');
let GlobalUpd;

wsClient.on('open', onConnect);

function onConnect() {
    console.log('Connected');
    wsClient.send(JSON.stringify({action:"greetings",data:{name:process.env.PC_NAME,comment:process.env.PC_COMMENT,ip:ip},password:process.env.PASSWORD,iterations:iter}));

    wsClient.on('close', function() {
        console.log('Restarting');
        iter ++;
        wsClient = new WebSocket('wss://dota.tool.phonograf.site/socket');
        console.log(`RS = ${wsClient.readyState}`);
        wsClient.on('open', onConnect);

    });

    wsClient.on('message', function(message) {
        console.log(message);
        try {
            const jsonMessage = JSON.parse(message);
            switch (jsonMessage.action) {
                case 'ECHO':
                    wsClient.send(jsonMessage.data);
                    break;
                case 'PING':
                    setTimeout(function() {
                        wsClient.send('PONG');
                    }, 2000);
                    break;
                case 'DM':
                    //console.log("sda");
                    notifier.notify({
                        title: 'Msg from admin',
                        message: jsonMessage.data,
                        icon: path.join(__dirname, 'LogoWhite.png'),
                        appID:"Эпичный Инструмент Доставки Сообщений"
                      });
                break;
                case 'DOTA_Status':
                    
                default:
                    console.log('Неизвестная команда');
                    break;
            }
        } catch (error) {
            console.log('Ошибка', error);
        }
    });
/*
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    async function update(counter,messG) {
        try {
            //console.log(GlobalB);
            let GSTime = GlobalB.map.clock_time;
            let GSStatus = GlobalB.map.game_state;
            wsClient.send(`${GSStatus}---${GSTime}`);
        } catch (error) {
            console.log(`Could not get details about Time and Status`);
        }
         await sleep(60000);
         counter++;
         update(counter,messG);
     }
     console.log(GlobalUpd);
    
     if (GlobalUpd==undefined) {
         console.log("starting service")
         GlobalUpd = update(0);
     }
     */
}




var d2gsi = require('dota2-gsi');
var server = new d2gsi({
    port:59874
});
 
server.events.on('newclient', function(client) {
    console.log("New client connection, IP address: " + client.ip);
    //hero:team#:player#:id
    console.log(client);
    if (client.auth && client.auth.token) {
        console.log("Auth token: " + client.auth.token);
    } else {
        console.log("No Auth token");
    }
 
    client.on('player:activity', function(activity) {
        if (activity == 'playing') console.log("Game started!");
        try {
            //template for id checker
            //console.log(JSON.stringify(client.gamestate.player));
            SendRoster(client);
        } catch (error) {
            console.log(error);
        }
        
    });
    client.on('map:game_state', function(data) {
        console.log(`Game Status: ${data}`);
        //wsClient.send(`warn! Game Status has changed - ${new Date()} -  Data: ${data}\n`);
        SendRoster(client);
    });
    client.on('map:paused', function(data) {
        console.log(`paused: ${data}`);
        wsClient.send(`warn! Game Status has changed - ${new Date()} -  Paused is ${data}\n`);
    });
    client.on('map:win_team', function(data) {
        console.log(`Winner: ${data}`);
        wsClient.send(`warn! Game Status has changed - ${new Date()} - Winner is ${data}\n`);
    });
    client.on('newdata', function(data) {
        let GSTime;
        try {
            GSTime = data.map.clock_time;
        } catch (error) {
           GSTime = -1000;
        }
        let GSStatus
        try {
            GSStatus  = data.map.game_state;
        } catch (error) {
            GSStatus = -1000;
        }
        //console.log(` event -- ${GSStatus}---${GSTime}}`);
        wsClient.send(`${GSStatus}---${GSTime}`);
    });
    function SendRoster(params) {
        let t = [{"RosterInfo":true}];
        try {
            //team 2
            for (let index = 0; index < 5; index++) {
                let key = 'player'+index;
                let element = params.gamestate.player.team2[key];
                if (element == undefined) {
                    continue
                }
                t.push({
                    "steamid":element.steamid,
                    "accountid":element.accountid,
                    "name":element.name
                })
            }
            //team 3
            for (let index = 5; index < 10; index++) {
                let key = 'player'+index;
                let element = params.gamestate.player.team3[key];
                if (element == undefined) {
                    continue
                }
                t.push({
                    "steamid":element.steamid,
                    "accountid":element.accountid,
                    "name":element.name
                })
            }
        } catch (error) {
           console.log("Roster isn't ready or full");
           //console.log(error);
           return
        }
        wsClient.send(JSON.stringify(t));
    }
});

(function wait () {
    if (bool!=1) setTimeout(wait, 1000);
 })();