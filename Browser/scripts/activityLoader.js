//import * as loader from './loader.js';
import pkg from 'fs';
const fs = await pkg;
const readdirSync = fs.readdirSync;
import log from './functions.js';

export default async function importer() {
    let returner = {
        translator: {},
        basics: {}
    };
    let simpleCounter = 0;
    for (const type of readdirSync('./scripts/casesForActivity/')) {
        for (const file of readdirSync('./scripts/casesForActivity/' + type).filter((f) => f.endsWith('.js'))) {
            let module = await import(`./casesForActivity/${type}/${file}`);
            if (!module) continue;
            if (type != 'translators') {
                returner.basics[file.split('.js')[0]] = module;
            } else {
                returner.translator[file.split('.js')[0]] = module;
            }
            log('Found: ' + file, 'info');
            simpleCounter++;
        };
    };
    log(`Returning ${simpleCounter} scripts`, 'done');
    return returner;
};