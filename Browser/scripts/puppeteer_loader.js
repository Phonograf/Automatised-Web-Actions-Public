import pkg from 'fs';
import log from './functions.js';
import puppeteer from "puppeteer-extra";
import { config, configDotenv } from 'dotenv';
config({ path: `../../Configs/.env.client`});
import techconfig from '../../Configs/browser-modules.json';
import Module from 'module';

//Built-in modules
import RecaptchaPlugin from 'puppeteer-extra-plugin-recaptcha';
import h_typing from "./scripts/plugins/puppeteer-extra-plugin-human-typing/index.js";
import pluginStealth from 'puppeteer-extra-plugin-stealth';
import { executablePath } from 'puppeteer';
import { createCursor } from "ghost-cursor";
import randomUseragent from 'random-useragent';




export default async function importer() {
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

    let simpleCounter = 0;
   for (let index = 0; index < techconfig.modules.length; index++) {
    const element = techconfig.modules[index];
    if(!element['import-allowed']) {
        if (element['built-in']) log(`Import for ${element.name} built-in function was disabled`,'warn');
        continue
    }
    log(`Importing ${element.name}`,"info");
    //import and preparation to use
    let result = await import(element.import)
    .then((async (module) =>{
        if(init_function_enabled){
            let temp_exec = await import(element.init_function);
            return result = await temp_exec(module, process.env, element['functions-to-be-returned']);
        }
        return result=module
    }))
    .catch((error)=>{
        log(`Failed to import ${element.name}. ${error.name} - ${error.message}`,'err');
    });
    console.log(result);
    //import something?
    if (element['return-functions']) {
        let exp = {};
        for (let j = 0; j < element['functions-to-be-returned'].length; j++) {
            const element = element['functions-to-be-returned'][j];
            //= result[element];
            
        }
    }
    simpleCounter++;
   }


    log(`Added ${simpleCounter} plugins. Returning puppeteer`, 'done');

};