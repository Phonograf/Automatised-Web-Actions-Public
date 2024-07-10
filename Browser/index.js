//#region Imports
import { config } from "dotenv";
config();
import puppeteer from "puppeteer-extra";
import { readdirSync } from 'fs';
import { createCursor } from "ghost-cursor";
import RecaptchaPlugin from 'puppeteer-extra-plugin-recaptcha';
import h_typing from "./puppeteer-extra-plugin-human-typing";
import randomUseragent from 'random-useragent';
// Add stealth plugin and use defaults 
import pluginStealth from 'puppeteer-extra-plugin-stealth'; 
import {executablePath} from 'puppeteer'; 
import schedule from 'node-schedule';
const humanTyping = h_typing({
    backspaceMaximumDelayInMs: 750 * 2,
    backspaceMinimumDelayInMs: 750,
    chanceToKeepATypoInPercent: 0,
    keyboardLayout: "en",
    keyboardLayouts: {
        en: [
            ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-"],
            ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p", "["],
            ["a", "s", "d", "f", "g", "h", "j", "k", "l", ";", "'"],
            ["z", "x", "c", "v", "b", "n", "m", ",", ".", "/"],
        ],
    },
    maximumDelayInMs: 650,
    minimumDelayInMs: 150,
    typoChanceInPercent: 0,
});
puppeteer.use(humanTyping);
puppeteer.use(pluginStealth());
puppeteer.use(
    RecaptchaPlugin({
      provider: {
        id: '2captcha',
        token: process.env.RecaptchaAPI
      },
      visualFeedback: true // colorize reCAPTCHAs (violet = detected, green = solved)
    })
  );

import sqlite3 from 'better-sqlite3';
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
import excel2csv from 'excel2csv';
//import functions and classes
import log from './scripts/functions.js';
import {VPN} from './scripts/Windscribe.js';
import {SQLUserExtraction} from './scripts/SQLUserImport.js';
import {SQLWriteSignUp} from './scripts/SQLWrite.js'
log(`Scripts were loaded`, 'done');
//#endregion


//#region Basic Links
const urlM = process.env.SITE;//Target
if (!urlM) {
    log(`Please provide a URL in .env`, 'err');
    throw "Please provide a URL in .env";
}
log(`URL: ${urlM}`, 'info');

// To be Changed
let urlR = process.env.REFERRER || "https://discord.com";
log(`Referrer URL: ${urlR}`, 'info');
//#endregion

//#region Define Program Launched purpose

/*Specifications for CMD

node index.js [Purpose] [Id (optional/required)]

Where Purpose can be:
* recurrent - Regullar state of the script for the long time host. Default state
* signup - Sign Up user. ID is required. Used ID may cause handled or unhandled mistakes (depends on the updates)
* activity - Activity for refistered user. ID is required. Not-used ID may cause handled or unhandled mistakes
* manual - Calling headless:false browser session for user
example: node index.js signup 4

Where Id is the number

*/

switch (process.argv[2]) {
    case "recurrent":
        log("Defined action as Recurrent", "info");
        Plan();
        break;
    case "signup":
        log("Defined action as SignUp", "info");
        await EngageSignUp();
        async function EngageSignUp(params) {
            let id = Number(process.argv[3]) || await DefineID() || 1;
            async function DefineID() {
                let result = 0;
                return result;
            }
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
            SignUp(urlM, urlR, user);
        }
        break;
    case "activity":
        log("Defined action as Activity", "info");
        log("In DEV", "err");
        break;
    case "manual":
        log("Defined action as Manual login", "info");
        await EngageManual();
        async function EngageManual(params) {
            let id = Number(process.argv[3]) || await DefineID() || 1;
            async function DefineID() {
                let result = 5;
                return result;
            }
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
            Manual(urlM,urlR,user);
        }
        break;
    case "teststealth":
        log("In DEV", "err");
    break;

    default:
        log("Defined action as Recurrent", "info");
        Plan();
        break;
}


//#endregion


//#region Webscrapper Sign Up
function run(url, referrer, user, vpnref) {
    log(`Opening Browser`, 'info');
    let ToBeReturned = new Promise(async (resolve, reject) => {
        let StayTime = 0;
        let browser;
        let incLog = "";
        try {
            if (user.email == undefined) {
                log(`User wasn't received. Proceeding empty session`, 'warn');
                //reject("User wasn't received");
            }
            browser = await puppeteer.launch({
                userDataDir: `${process.env.PathToSessions}/${user.id}`,
                headless: true,
                executablePath: executablePath()
            });
            const page = await browser.newPage();
            const cursor = createCursor(page);
            let refTable = user.userData.Refferer;
            let execRef = refTable || referrer;
            await page.goto(execRef,{waitUntil: 'load', timeout: 0});
            log(`Referrer page (${execRef}) was loaded`, 'done');
           // page.setExtraHTTPHeaders({ referer: execRef });
            // Add Headers 
            function Rand(min, max) {
                min = Math.ceil(min);
                max = Math.floor(max);
                return Math.floor(Math.random() * (max - min + 1)) + min;
            }
            //let UA = ['Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36 Edg/109.0.1518.5','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36 OPR/109.0.0.','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/115.','Mozilla/5.0 (Windows NT 6.1; WOW64; rv:12.0) Gecko/20100101 Firefox/12.0', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:53.0) Gecko/20100101 Firefox/53.0', 'Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1; SV1)','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36 Edg/125.0.2535.67','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.3']
	        await page.setExtraHTTPHeaders({ 
		    'user-agent': randomUseragent.getRandom(), 
            'referer':execRef 
	        }); 
            await page.goto(url,{waitUntil: 'load', timeout: 0});
            log(`Target page was loaded`, 'done');
            function Addtime(params) {
                StayTime++;
            }
            let counter = setInterval(Addtime, 1000);

            async function ActivityForSignUp(Minimum, Maximum,banned) {
                //Load Scripts
                let ARR = [];
                let prohibited = banned || [];
                for (const file of readdirSync('./Activity_Scripts').filter((f) => f.endsWith('.xlsx'))) {
                    if (prohibited.indexOf(file) == -1) {
                        ARR.push(file);
                    }
                }
                log(`Found ${ARR.length} scripts`, 'info');
                //RandomZone
                function Rand(min, max) {
                    min = Math.ceil(min);
                    max = Math.floor(max);
                    return Math.floor(Math.random() * (max - min + 1)) + min;
                }
                async function fetchExcel(param) {
                    let options = {
                        csvPath:'./signups', // string path to the output CSV file
                        sheetIndex:0, // optional, 0-based index of the Excel sheet to be converted to CSV (default is 0)
                        //sheetName, // optional, sheet name in the Excel file to be converted to CSV
                        writeCsv:false, // if true, the output will be written to a file, otherwise will be returned by the function
                      }
                    let data = (await excel2csv.convert(`Activity_Scripts/${param}`, options)).split('\n');
                    return data;
                }
                let bound = Rand(Minimum, Maximum)
                for (let index = 0; index < bound; index++) {
                    let tee = ARR[Rand(0, ARR.length - 1)];
                    let script = await fetchExcel(tee);
                    log(`Executing script ${tee}`, "info");
                    //console.log(script);

                    for (let j = 1; j < script.length; j++) {
                        //const element = script[j];
                        let medium = script[j].split(",");
                        const element = {
                            action:medium[1],
                            purpose:medium[2],
                            selector:medium[3]
                        };
                        switch (element.action) {
                            case "break":
                                log(`${element.purpose} - ${element.selector}`, "info");
                                await sleep(Number(element.selector));
                                break;
                            case "click":
                                await waitandpress(element.selector, element.purpose);
                                break;
                            case "write":
                                await write(element.selector, element.comment, element.purpose)
                                break;
                            case "end":
                                j=script.length;
                                break;
                            case "goto":
                                log(`${element.purpose} - ${element.selector}`, "info");
                                await page.goto(element.selector,{waitUntil: 'load', timeout: 0});
                                break;
                            case "clckrnd":
                                log(`${element.purpose} - ${element.selector}`, "info");
                                await waitandpress(`.G:nth-child(2) > .df.df--hover.df--clickable:nth-child(${Rand(1,7)})`, element.purpose);
                                break;
                            case "closecookies":
                                try {
                                    await page.waitForSelector(element.selector);
                                    //await cursor.move(selector);
                                    await cursor.click(element.selector);
                                    log(`MS_CloseCookies ${element.purpose}`, 'info');
                                } catch (error) {
                                    log(`Cookie close failed. Was it closed before?`, 'warn');
                                }
                                break;
                            default:
                                log("Action isn't defined or has a mistake", "warn");
                                break;
                        }
                    }
                    log(`Executed script ${tee}`, "done");
                }
                
            }

            async function waitandpress(selector, purpose) {
                try {
                    await page.waitForSelector(selector);
                    //await cursor.move(selector);
                    await cursor.click(selector);
                    log(`MS_action ${purpose}`, 'info');
                } catch (error) {
                    log(`Error on ${purpose} - ${error.name}`, 'err');
                }
                
            }
            async function write(selector, content, purpose) {
                await page.typeHuman(`${selector}`, content, {
                    backspaceMaximumDelayInMs: 750 * 2,
                    backspaceMinimumDelayInMs: 750,
                    keyboardLayout: "en",
                    keyboardLayouts: {
                        en: [
                            ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-"],
                            ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p", "["],
                            ["a", "s", "d", "f", "g", "h", "j", "k", "l", ";", "'"],
                            ["z", "x", "c", "v", "b", "n", "m", ",", ".", "/"],
                        ],
                    },
                    maximumDelayInMs: 650,
                    minimumDelayInMs: 150,
                    typoChanceInPercent: 0,
                    chanceToKeepATypoInPercent: 0
                });
                log(`KB_action ${purpose}`, 'info');
            }
            function sleep(ms) {
                return new Promise(resolve => setTimeout(resolve, ms));
            }

            async function SignUpAction(params) {
                //#region Direct Sign Up Actions
                //Click on sign up button
                let selector;
                selector = ".btn";
                await waitandpress(selector, "Press on Sign Up button");

                //Call full form 
                selector = "#sign_up_input_login";
                await waitandpress(selector, "Call full form - login click");
                await write(selector, user.nickname, "Login Write");

                //sign_up_input_email
                selector = "#sign_up_input_email";
                await waitandpress(selector, "Email click");
                await write(selector, user.email, "Email Write");

                //sign_up_input_password
                selector = "#sign_up_input_password";
                await waitandpress(selector, "Password click");
                await write(selector, user.email, "Password Write");

                //Captcha
                let a = await page.solveRecaptchas();
                log(`Captcha ended with ${JSON.stringify(a.solved)}`,'info');

                //cx__join
                //selector = ".cx__join"; DEPRECATED
                selector = '[type="submit"]';
                await waitandpress(selector, "Press on Sending Sign Up button");
                //#endregion
                //Quality Control
            log("Screenshot made", "info");
            await page.screenshot({ path: `./data/${user.id}/Filled.png` });

            let AwaitingSuccess = new Promise(async (resolve, reject) => {
                let a = setTimeout(() => log("10 seconds passed", "info"), 10000);
                setTimeout(() => { reject("Missing confirmation"); }, 15000);
                try {
                    await page.waitForSelector(".header-notification-body");
                    resolve("Confirmation received");
                } catch (error) {
                    
                }
            });
            
            await AwaitingSuccess
                .then(
                    async result => {
                        log(result, 'done');
                        //Place for success result
                        await page.screenshot({ path: `./data/${user.id}/Success.png` });
                        //Stay on the page

                        //Write a report
                        SQLWriteSignUp({
                            Id: user.id,
                            RelativeStorage: user.id,
                            IncidentLog: "",
                            Created: 1,
                            StayTime: StayTime,
                            DateCreated:Date.now(),
                            VPNreferenc: vpnref
                        });
                    },
                    async error => {
                        log(error, 'warn');
                        //Place for doubtful result
                        await page.screenshot({ path: `./data/${user.id}/Doubt.png` });
                        //Stay on the page

                        //Write a report
                        let matter="Doubt! Check Doubt.png";
                        incLog = matter;
                        if ((user.email==undefined)||user.email==null) {
                            matter = "Empty session"
                        }
                        SQLWriteSignUp({
                            Id: user.id,
                            RelativeStorage: user.id,
                            IncidentLog: matter,
                            Created: 1,
                            DateCreated:Date.now(),
                            StayTime: StayTime,
                            VPNreferenc: vpnref
                        });
                    }
                );
            }

            //Dismiss banner
            try {
                let selector = ".modal-ds-close-icon";
                await waitandpress(selector, "Dismiss initiating banner"); 
            } catch (error) {
                log(`${error.name} - probably it's not the 1st launch for this session`,"warn");
            }
            

           if(user.userData.raw==1){
            await ActivityForSignUp(1,4,['goToTrends.xlsx','gotoModel_Copy.xlsx','gotoModel.xlsx','closeCookies.xlsx']);
            await SignUpAction();
           }
            
            //Post Sign-Up zone
            await ActivityForSignUp(5,12,[]);
            SQLWriteSignUp({
                Id: user.id,
                RelativeStorage: user.id,
                IncidentLog: incLog,
                Created: 1,
                StayTime: StayTime,
                DateCreated:Date.now(),
                VPNreferenc: vpnref
            });
            browser.close();
            return resolve("Success");
        } catch (e) {
            SQLWriteSignUp({
                Id: user.id,
                RelativeStorage: user.id,
                IncidentLog: e.name,
                Created: 1,
                StayTime: StayTime,
                VPNreferenc: vpnref
            });
            try {
                browser.close();
            } catch (error) {
                console.log(error);
            }
            return reject(e);
        }
    });
    return ToBeReturned;
}
//#endregion

//#region Sign Up
async function SignUp(urlM, urlR, user) {
    //Launch VPN
    let requiredVPNparam;
    try {
        requiredVPNparam = user.userData.VPNreferenc;
    } catch (error) {
        log("Missing VPN Id. VPN will be decided randomly", "warn");
        requiredVPNparam = undefined;
    }
    let VPNSession = new VPN(requiredVPNparam);
    let launched = await VPNSession.initiate();
    if ((launched == "Failed")) {
        log("VPN failed", "err");
        if ((process.env.VPNFailStop == true)) {
            log("Exiting according with the Settings", "err");
            return
        }
    }
    //Launch Webscrapper
    await run(urlM, urlR, user, VPNSession._specID).then(
        response => {
            log(response, 'done');
            //Disable VPN session
            VPNSession.VPNDisable(); 
        },
        error => { 
            log(error, 'err'); 
            //console.log(error);
            //Disable VPN session
            //VPNSession.VPNDisable(); 
        }
    );

    
}

//#endregion

//#region Manual
function runManual(url, referrer, user, vpnref) {
    log(`Opening Browser`, 'info');
    let ToBeReturned = new Promise(async (resolve, reject) => {
        let browser;
        try {
            if (user.email == undefined) {
                log(`User wasn't received. Proceeding empty session`, 'warn');
                //reject("User wasn't received");
            }
            browser = await puppeteer.launch({
                userDataDir: `${process.env.PathToSessions}/${user.id}`,
                headless: false,
                executablePath: executablePath()
            });
            const page = await browser.newPage();
            const cursor = createCursor(page);
            let refTable = user.userData.Refferer;
            let execRef = refTable || referrer;
            await page.goto(execRef,{waitUntil: 'load', timeout: 0});
            log(`Referrer page (${execRef}) was loaded`, 'done');
	        await page.setExtraHTTPHeaders({ 
		    'user-agent': randomUseragent.getRandom(), 
            'referer':execRef 
	        }); 
            await page.goto(url,{waitUntil: 'load', timeout: 0});
            log(`Target page was loaded`, 'done');
            
            let sql = `UPDATE [Mainframe] set
            DateLastChanged=${Date.now()}
            Where Id=${user.id};`
            //console.log(sql);
            let result;
            try {
                result = db.prepare(sql).run();
                log(`Successfuly stored: ${user.id}`, 'info');
            } catch (error) {
                log(error, 'err');
            }

            return resolve("Success");
        } catch (e) {
            log(`err ${e.name}`,'err');
            return reject(e);
        }
    });
    return ToBeReturned;
}

async function Manual(urlM, urlR, user) {
    //Launch VPN
    let requiredVPNparam;
    try {
        requiredVPNparam = user.userData.VPNreferenc;
    } catch (error) {
        log("Missing VPN Id. VPN will be decided randomly", "warn");
        requiredVPNparam = undefined;
    }
    let VPNSession = new VPN(requiredVPNparam);
    let launched = await VPNSession.initiate();
    if ((launched == "Failed")) {
        log("VPN failed", "err");
        if ((process.env.VPNFailStop == true)) {
            log("Exiting according with the Settings", "err");
            return
        }
    }
    //Launch Webscrapper
    await runManual(urlM, urlR, user, VPNSession._specID).then(
        response => {
            log(response, 'done');
            //Disable VPN session
            //VPNSession.VPNDisable(); 
        },
        error => { 
            log(error, 'err'); 
            //console.log(error);
            //Disable VPN session
            //VPNSession.VPNDisable(); 
        }
    );

    
}

//#endregion


//#region Recurring
async function Plan(params) {
    let sql = `select * from [Mainframe] where Created =0`;
    let user;
    try {
        user = db.prepare(sql).all();
        log(`Found entries: ${user.length}`, 'done');
    } catch (error) {
        log(error, 'err');
        throw new Error("ShutDown");
    }
    let scheed = [];
    for (let i = 0; i < user.length; i++) {
        //console.log(new Date(user[i].DateToCreate));
        let userB = user[i];
                userB = {
                id: userB.Id,
                nickname: userB.Nickname,
                email: userB.Email,
                password: userB.Password,
                referrer: userB.Referrer,
                userData: userB
                }
                if (user[i].DateToCreate==0) {
                    log(`Requested User to signUp ${userB.id}`,"info");
                    SignUp(urlM, urlR, userB);
                }
        scheed.push(schedule.scheduleJob(new Date(user[i].DateToCreate || 0),  
            function start(i) {
                //console.log("Worked");
                log(`Requested User to signUp ${userB.id}`,"info");
                SignUp(urlM, urlR, userB);
            }.bind(null,userB)
        ));
    }
}
//#endregion