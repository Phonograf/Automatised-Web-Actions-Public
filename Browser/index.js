//#region Imports
import { config } from "dotenv";
config({ path: `../Configs/.env.client` });
import puppeteer from "puppeteer-extra";
import { readdirSync } from 'fs';
import { createCursor } from "ghost-cursor";
import RecaptchaPlugin from 'puppeteer-extra-plugin-recaptcha';
import h_typing from "./scripts/puppeteer-extra-plugin-human-typing/index.js";
import randomUseragent from 'random-useragent';
// Add stealth plugin and use defaults 
import pluginStealth from 'puppeteer-extra-plugin-stealth';
import { executablePath } from 'puppeteer';
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
            Target TEXT,
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
    db.run(`CREATE TABLE Windscribe (
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

//import functions and classes
import log from './scripts/functions.js';
import { VPN } from './scripts/Windscribe.js';
import { SQLUserExtraction } from './scripts/SQLUserImport.js';
import { SQLWriteSignUp } from './scripts/SQLWrite.js';
import { SendMessage } from "./main.js";
import {fetchExcel} from './scripts/casesForActivity/fetchExcel.js';
log(`Scripts were loaded`, 'done');

//deprecated region - it's easier to make empty string than to fix
let urlM = "";
let scheed = [];
let urlR = "";
//#endregion

//#region Define Program Launched purpose

/*Specifications for CMD

node self.js [Purpose] [Id (optional/required)]

Where Purpose can be:
* recurrent - Regullar state of the script for the long time host. Default state
* signup - Sign Up user. ID is required. Used ID may cause handled or unhandled mistakes (depends on the updates)
* activity - Activity for refistered user. ID is required. Not-used ID may cause handled or unhandled mistakes
* manual - Calling headless:false browser session for user
example: node index.js signup 4

Where Id is the number

*/
export async function selfLaunch(params) {
    params = params.split(" ");
    switch (params[0]) {
        case "recurrent":
            log("Defined action as Recurrent", "info");
            Plan();
            break;
        case "actionSingle":
            log("Defined action as SignUp", "info");
            log("Deprecated", "warn");
            await EngageSignUp();
            async function EngageSignUp(params) {
                let id = Number(params[1]) || 1;
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
                console.log(user);
                if (params[2] == true) {
                    UseVPN(urlM, urlR, user, params[3]);
                } else {
                    NoVPN(urlM, urlR, user, params[3]);
                }
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
                let id = Number(params[1]) || await DefineID() || 1;
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
                Manual("", urlR, user);
            }
            break;

        default:
            log("Defined action as Recurrent", "info");
            Plan();
            break;
    }
}



//#endregion


//#region Webscrapper 
function run(user, vpnref, specialInstructions) {
    let url = user.userData.Target;
    SendMessage("info", `Launched ${user.Id}`);
    /*
    ACCEPTING
            {
                id: userB.Id,
                nickname: userB.Nickname,
                email: userB.Email,
                password: userB.Password,
                referrer: userB.Referrer,
                userData: userB
            }
    */
    log(`Opening Browser`, 'info');
    let ToBeReturned = new Promise(async (resolve, reject) => {
        //global vars
        let StayTime = 0;
        let browser;
        let incLog = "";
        try {
            //DEPRECATED - to be relocated
            /*
            if (user.email == undefined) {
                log(`User wasn't received. Proceeding empty session`, 'warn');
                //reject("User wasn't received");
            }
            */
            //launch browser
            browser = await puppeteer.launch({
                userDataDir: `${process.env.PathToSessions}/${user.id}`,
                headless: false,
                executablePath: executablePath()
            });
            const page = await browser.newPage();
            const cursor = createCursor(page);
            let headers = {}

            //referrer
            if (user.userData.Refferer) {
                if (process.env.VisitReferer) {
                    await page.goto(user.userData.Refferer, { waitUntil: 'load', timeout: 0 });
                } else {
                    headers['Referer'] = user.userData.Referrer;
                }
                log(`Referer page (${user.userData.Refferer}) was proceeded`, 'done');
            }
            // User agent plugin. IMPORTANT! CAPTCHA WON"T BE LOADED WITH USER AGENT
            if (process.env.UserAgent == true) {
                headers['User-Agent'] = randomUseragent.getRandom();
            }

            // Target Page
            log(url, 'done');
            await page.setExtraHTTPHeaders(headers);
            await page.goto(url, { waitUntil: 'load', timeout: 0 });
            log(`Target page was loaded`, 'done');

            // Technical functions
            function Addtime(params) {
                StayTime++;
            }
            let counter = setInterval(Addtime, 1000);
            function Rand(min, max) {
                min = Math.ceil(min);
                max = Math.floor(max);
                return Math.floor(Math.random() * (max - min + 1)) + min;
            }
            //activities
            async function RandActivity(Minimum, Maximum, banned) {
                //Load Scripts
                let ARR = [];
                let prohibited = banned || [];
                for (const file of readdirSync('./Activity_Scripts').filter((f) => f.endsWith('.xlsx'))) {
                    if (prohibited.indexOf(file) == -1) {
                        ARR.push(file);
                    }
                }
                log(`Found ${ARR.length} scripts`, 'info');
                function shuffle(array) {
                    let currentIndex = array.length;
                    // While there remain elements to shuffle...
                    while (currentIndex != 0) {
                        // Pick a remaining element...
                        let randomIndex = Math.floor(Math.random() * currentIndex);
                        currentIndex--;
                        // And swap it with the current element.
                        [array[currentIndex], array[randomIndex]] = [
                            array[randomIndex], array[currentIndex]];
                    }
                }
                shuffle(Rand);
                let bound = Rand(Minimum, Maximum);
                await activity(ARR, bound);
            }

            async function activity(ARR, bound) {
                bound = bound || ARR.length;
                for (let index = 0; index < bound; index++) {
                    let tee = ARR[index];
                    let script = await fetchExcel(tee);
                    log(`Executing script ${tee}`, "info");
                    for (let j = 1; j < script.length; j++) {
                        let medium = script[j].split(",");
                        const element = {
                            action: medium[1],
                            purpose: medium[2],
                            selector: medium[3],
                            comment: medium[4]
                        };
                        //Should be deprecated
                        switch (element.action) {
                            case "break":
                                log(`${element.purpose} - ${element.selector}`, "info");
                                await sleep(Number(element.selector));
                                break;
                            case "click":
                                await waitandpress(element.selector, element.purpose);
                                break;
                            case "log":
                                log(element.selector, element.purpose);
                                break;
                            case "screenshot":
                                await page.screenshot({ path: `../DBs/sessions/${user.id}/${element.selector}.png` });
                                log("Screenshot made", "info");
                                break;
                            case "awaitingconfirmation":
                                log(`${element.purpose} waiting for ${element.selector}`, 'info');
                                let AwaitingSuccess = new Promise(async (resolve, reject) => {
                                    let a = setTimeout(() => log("10 seconds passed", "info"), 10000);
                                    setTimeout(() => { reject("Missing confirmation"); }, 15000);
                                    try {
                                        await page.waitForSelector(element.selector);
                                        resolve("Confirmation received");
                                    } catch (error) {
                                        reject("Error");
                                    }
                                });

                                await AwaitingSuccess
                                    .then(
                                        async result => {
                                            log(result, 'done');
                                            //Place for success result
                                            //await page.screenshot({ path: `./data/${user.id}/Success.png` });
                                        },
                                        async error => {
                                            log(error, 'warn');
                                            //Place for doubtful result
                                            //await page.screenshot({ path: `./data/${user.id}/Doubt.png` });
                                            //Stay on the page

                                            //Write a report
                                            let matter = "Doubt! Check Doubt.png";
                                            incLog = matter;
                                            if ((user.email == undefined) || user.email == null) {
                                                matter = "Empty session"
                                            }
                                            log(matter, 'info')
                                        }
                                    );

                                break;
                            case "write":
                                let to_write = element.comment;
                                if (element.comment == "fromuser") {
                                    log('user case', 'info');
                                    switch (element.purpose) {
                                        case "nickname":
                                            to_write = user.nickname;
                                            break;
                                        case "email":
                                            to_write = user.email;
                                            break;
                                        case "password":
                                            to_write = user.password;
                                            break;
                                    }
                                }
                                await write(element.selector, to_write, element.purpose)
                                break;
                            case "captcha":
                                log(`captcha - ${element.purpose}`, "info");
                                await captcha();
                                break;
                            case "end":
                                j = script.length;
                                //Delete from pool if unique is stated in purpose
                                if ((element.purpose == "unique") || (element.selector == "unique")) {
                                    ARR.splice(j, 1);
                                }
                                break;
                            case "goto":
                                log(`${element.purpose} - ${element.selector}`, "info");
                                await page.goto(element.selector, { waitUntil: 'load', timeout: 0 });
                                break;
                            case "clckrnd":
                                log(`${element.purpose} - ${element.selector}`, "info");
                                //example .G:nth-child(2) > .df.df--hover.df--clickable:
                                await waitandpress(`${element.selector}:nth-child(${Rand(1, 7)})`, element.purpose);
                                break;
                            case "closecookies":
                                try {
                                    await page.waitForSelector(element.selector);
                                    await cursor.click(element.selector);
                                    log(`MS_CloseCookies ${element.purpose}`, 'info');
                                } catch (error) {
                                    log(`Cookie close failed. Was it closed before?`, 'warn');
                                }
                                break;
                            case "risqueaction":
                                try {
                                    await cursor.click('[type="submit"]');
                                    log(`Success ${element.purpose}`, 'info');
                                } catch (error) {
                                    log(`Failed ${element.purpose}`, 'warn');
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
            async function captcha(params) {
                let a = await page.solveRecaptchas();
                log(`Captcha ended with ${JSON.stringify(a.solved)}`, 'info');
                return
            }
            function sleep(ms) {
                return new Promise(resolve => setTimeout(resolve, ms));
            }

            //Main execution
            log(`executing scripts`, 'info');
            specialInstructions = JSON.parse(String(specialInstructions)) || [["rand", 2, 5, "LS_signup.xlsx"]];
            log(specialInstructions, 'info');
            for (let index = 0; index < specialInstructions.length; index++) {
                let element = specialInstructions[index];
                let mass = [];
                switch (element[0]) {
                    case "rand":
                        //banned actions
                        for (let j = 3; j < element.length; j++) {
                            mass.push(element[j]);
                        }
                        await RandActivity(element[1], element[2], mass);
                        break;
                    case "action":
                        //accepting NAME OF FILES 
                        for (let j = 1; j < element.length; j++) {
                            mass.push(element[j]);
                        }
                        await activity(mass);
                        break;

                    default:
                        log(`Failed to understand ${element[0]}`, 'warn');
                        break;
                }
            }

            SQLWriteSignUp({
                Id: user.id,
                RelativeStorage: user.id,
                IncidentLog: incLog,
                Created: 1,
                StayTime: StayTime,
                CreateTime: Date.now(),
                VPNreferenc: vpnref
            });
            browser.close();
            return resolve("Success");
        } catch (e) {
            SQLWriteSignUp({
                Id: user.id,
                RelativeStorage: user.id,
                IncidentLog: `${e.name}- ${e.message}`,
                Created: -1,
                StayTime: StayTime,
                VPNreferenc: vpnref
            });
            browser.close();
            return reject(e);
        }
    });
    return ToBeReturned;
}
//#endregion

//#region Pre-launch
export async function UseVPN(urlM, urlR, user, specialInstructions) {
    //Launch VPN
    let requiredVPNparam;
    //checking passed params
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
    await run(user, VPNSession._specID, specialInstructions).then(
        response => {
            log(response, 'done');
            //Disable VPN session
            VPNSession.VPNDisable();
        },
        error => {
            log(error, 'err');
            //Disable VPN session
            VPNSession.VPNDisable();
        }
    );
    return 0;
}

export async function NoVPN(urlM, urlR, user, specialInstructions) {
    //Launch Webscrapper
    await run(user, "", specialInstructions).then(
        response => {
            log(response, 'done');
        },
        error => {
            log(error, 'err');
        }
    );
    return 0;
}

//#endregion

//#region Manual
export function runManual(url, referrer, user, vpnref) {
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
            await page.goto(execRef, { waitUntil: 'load', timeout: 0 });
            log(`Referrer page (${execRef}) was loaded`, 'done');
            await page.setExtraHTTPHeaders({
                'user-agent': randomUseragent.getRandom(),
                'referer': execRef
            });
            await page.goto(url, { waitUntil: 'load', timeout: 0 });
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
            log(`err ${e.name}`, 'err');
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
export async function Plan(params) {
    let sql = `select * from [Mainframe] where Created =0`;
    let user;
    try {
        user = db.prepare(sql).all();
        log(`Found entries: ${user.length}`, 'info');
    } catch (error) {
        log(error, 'err');
        throw new Error("ShutDown");
    }

    for (let i = 0; i < user.length; i++) {
        //console.log(new Date(user[i].DateToCreate));
        let userB = user[i];
        let specialtask = userB.Plan;
        userB = {
            id: userB.Id,
            nickname: userB.Nickname,
            email: userB.Email,
            password: userB.Password,
            referrer: userB.Referrer,
            userData: userB
        }
        if (user[i].DateToCreate == -1) {
            log(`Requested User to signUp Right Now ${userB.id}`, "info");
            if (process.env.VPNUsage == true) {
                UseVPN(urlM, urlR, userB, specialtask);
            } else {
                NoVPN(urlM, urlR, userB, specialtask);
            }

        }
        scheed.push(schedule.scheduleJob(new Date(user[i].DateToCreate),
            function start(i) {
                log(`Requested User to signUp ${userB.id}`, "info");
                UseVPN(urlM, urlR, userB, specialtask);
            }.bind(null, userB)
        ));
    }
}
//#endregion