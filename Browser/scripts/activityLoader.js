import log from './functions.js';

module.exports = () => {
    for (const type of readdirSync('./casesForActivity/')) {
        for (const dir of readdirSync('./casesForActivity/' + type)) {
            for (const file of readdirSync('./casesForActivity/' + type + '/' + dir).filter((f) => f.endsWith('.js'))) {
                const module = require('../commands/' + type + '/' + dir + '/' + file);

                if (!module) continue;

                log('Loaded new command: ' + file, 'info');
            };
        };
    };
};