import WebSocket from 'ws';
import path from 'path';
import fs from 'fs';
import notifier from 'node-notifier';
import cmd from 'node-cmd';
import dotenv from 'dotenv';
dotenv.config();
import FileReader from 'filereader';
import { NoVPN, UseVPN, selfLaunch } from "./index.js";
import log from './scripts/functions.js';
import { SQLRaw } from './scripts/SQLraw.js';

//Global var
let currentDeploy;

export function Deploy(params) {
    //IP resolve
    let ip = "?";
    try {
        let m = cmd.runSync(
            "ipconfig"
        );
        if (m.err) {
            console.log(err);
            return;
        }
        try {
            ip = (m.data.split("IPv4-")[1].split(": ")[1].split("\n")[0]);
        } catch (err) {
            console.log("IP retry");
            try {
                ip = (m.data.split("IPv4")[1].split(": ")[1].split("\n")[0]);
            } catch (error) {
                log('IP Failed', 'warn');
            }

        }
        log(`Got IP ${ip}`, 'info')
    } catch (error) {
        log('IP Failed', 'warn');
    }
    //Iteration. 0 - new, 1+ - it exists. Probably Deprecated
    let iter = process.env.npm_config_iter || params || 0;
    console.log(`ini iter = ${iter}`);

    //WS Open
    let wsClient = new WebSocket(process.env.PathToWS);
    wsClient.on('open', onConnect);
}

function onConnect() {
    log('Connected', 'done');
    wsClient.send(JSON.stringify({ action: "greetings", data: { name: process.env.PC_NAME, comment: process.env.PC_COMMENT, ip: ip }, password: process.env.PASSWORD, iterations: iter }));

    wsClient.on('close', function () {
        iter++;
        log(`Restarting WS with iteration ${iter}`, 'info');
        wsClient = new WebSocket(process.env.PathToWS);
        log(`ReadyState = ${wsClient.readyState}`, 'info');
        wsClient.on('open', onConnect);
    });

    wsClient.on('message', function (message) {
        try {
            const jsonMessage = JSON.parse(message);
            switch (jsonMessage.action) {
                case 'ECHO':
                    wsClient.send(jsonMessage.data);
                    break;
                case 'DM':
                    notifier.notify({
                        title: 'Msg from admin',
                        message: jsonMessage.data,
                        icon: path.join(__dirname, 'LogoWhite.png'),
                        appID: "Epic Message Delivery"
                    });
                    break;
                case 'CMD':
                    cmd.run(
                        jsonMessage.data,
                        function (err, data, stderr) {
                            if (err) {
                                wsClient.send(JSON.stringify({
                                    action: "FileCallback",
                                    priority: "error",
                                    timestamp: Date.now(),
                                    data: `${err.name} - ${err.message}`
                                }));
                                console.log(err);
                                return;
                            }
                            console.log(data);
                            wsClient.send(JSON.stringify({
                                action: "FileCallback",
                                priority: "done",
                                timestamp: Date.now(),
                                data: `Success`
                            }));
                        }
                    );
                    break;
                case 'FILE':
                    let temp_ext = jsonMessage.extension || 'txt';
                    let path = "./files/"
                    if (temp_ext == "xlsx") {
                        path = "./Activity_Scripts";
                    }
                    let temp_name = jsonMessage.name || 'abc';
                    fs.writeFile(`${path}${temp_name}.${temp_ext}`, jsonMessage.data, (err) => {
                        if (err) {
                            wsClient.send(JSON.stringify({
                                action: "FileCallback",
                                priority: "error",
                                timestamp: Date.now(),
                                data: `${err.name} - ${err.message}`
                            }))
                        };
                    });
                    console.log(`Saved to ./files/${temp_name}.${temp_ext}`);
                    break;
                case "manual":
                    selfLaunch(`manual ${jsonMessage.data}`);
                    break;
                case "recurrent":
                    selfLaunch(`recurrent`);
                    break;
                case "SQLRaw":
                    SQLRaw(jsonMessage.data);
                    break;
                case "actionSingle":
                    async function engage(id) {
                        let user = await SQLUserExtraction(id);
                        user = user[0];
                        user = {
                            id: user.Id,
                            nickname: user.Nickname,
                            email: user.Email,
                            password: user.Password,
                            referrer: user.Referrer,
                            userData: user
                        }
                        return user
                    }
                    let user = engage(jsonMessage.id);
                    if (jsonMessage.data.vpn == true) {
                        UseVPN("", "", user,jsonMessage.data.specialInstructions)
                    }else{
                        NoVPN("", "", user,jsonMessage.data.specialInstructions)
                    }
                    break;
                default:
                    console.log('Unknown command');
                    break;
            }
        } catch (error) {
            console.log('Error', error);
        }
    });
}

export function SendMessage(priority, param) {
    try {
        wsClient.send(JSON.stringify
            ({
                action: "message",
                priority: priority,
                timestamp: Date.now(),
                data: param
            })
        );
    } catch (error) { }
}

function SendFile(name, extension, path) {
    let fileReader = new FileReader();
    fileReader.readAsDataURL(new File(path));

    // non-standard alias of `addEventListener` listening to non-standard `data` event
    fileReader.on('data', function (data) {
        wsClient.send(JSON.stringify
            ({
                action: "file",
                priority: "info",
                timestamp: Date.now(),
                data: {
                    name: name,
                    extension: extension,
                    file: data
                }
            })
        );
    });

}