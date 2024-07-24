/**
 * Go To Sleep (seriously, it's 2 a.m.)
 * @param {page} object - Passing page
 * @param {'element'} object - Passing object
 * @return {Promise}
 */

export default async function breaker(page,element) {
    let log= await import ('../../functions.js'); 
    log = (log).default;
    log(`${element.purpose} - ${element.selector}`, "info");
    await sleep(Number(element.selector));
}


function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}