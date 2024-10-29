import WebSocket from 'ws';
import * as pathER from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
let path = pathER;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import fs from 'fs';
import notifier from 'node-notifier';
import cmd from 'node-cmd';
import dotenv from 'dotenv';
dotenv.config();
import FileReader from 'filereader';
import { NoVPN, UseVPN, selfLaunch } from "./index.js";
import log from './scripts/functions.js';
import { SQLRaw } from './scripts/SQL/SQLraw.js';
import { SQLUserExtraction } from './scripts/SQL/SQLUserImport.js';

//Global var
let wsClient;
let ip;
let iter;

export function Deploy(params) {
    //IP resolve
    ip = "?";
    try {
        let m = cmd.runSync(
            "ipconfig"
        );
        if (m.err) {
            log(`IP CMD Failed`, 'warn');
            return;
        }
        try {
            ip = (m.data.split("IPv4-")[1].split(": ")[1].split("\n")[0]);
        } catch (err) {
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
    //Iteration. 0 - new, 1+ - it exists. 
    iter = process.env.npm_config_iter || params || 0;
    log(`ini iter = ${iter}`, 'info');

    //WS Open
    function start(params) {

    }

    wsClient = new WebSocket(process.env.PathToWS);

    wsClient.on('error', async function (err) {
        log('Web-Socket connection failed.', 'err');
        log(`Offline mode is available with self.js`, 'info');
        if (Boolean(process.env.RestartTime)==true) {
            log(`Repeat attempt in...${process.env.RestartTime}ms`,'info')
            await sleep(Number(process.env.RestartTime));
            Deploy();
        }
        

        function sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }
    });

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
            log(`Accepted message with ${jsonMessage.action}`, 'info');
            switch (jsonMessage.action) {
                case 'ECHO':
                    wsClient.send(jsonMessage.data);
                    break;
                case 'DM':
                    notifier.notify({
                        title: 'Msg from admin',
                        message: jsonMessage.data,
                        //icon: path.join(__dirname, 'LogoWhite.png'),
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
                                log(err, 'err');
                                return;
                            }
                            log(`CMD command received ${data}`, 'info');
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
                    let patht = "./files/"
                    if (temp_ext == "xlsx") {
                        patht = "./Activity_Scripts";
                    }
                    let temp_name = jsonMessage.name || 'abc';
                    fs.writeFile(`${patht}${temp_name}.${temp_ext}`, jsonMessage.data, (err) => {
                        if (err) {
                            wsClient.send(JSON.stringify({
                                action: "FileCallback",
                                priority: "error",
                                timestamp: Date.now(),
                                data: `${err.name} - ${err.message}`
                            }))
                        };
                    });
                    log(`Saved to ./files/${temp_name}.${temp_ext}`, 'info');
                    break;
                case 'SENDFILE':
                    SendFile(jsonMessage.data.name, jsonMessage.data.extension, jsonMessage.data.path);
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
                        if (jsonMessage.vpn == true) {
                            UseVPN("", "", user, jsonMessage.data.specialInstructions)
                        } else {
                            NoVPN("", "", user, jsonMessage.data.specialInstructions)
                        }
                        return user
                    }
                    engage(jsonMessage.id);

                    break;
                default:
                    log('Unknown command', 'warn');
                    break;
            }
        } catch (error) {
            log(error, 'err');
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
