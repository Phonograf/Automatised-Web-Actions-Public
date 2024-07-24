/**
 * Go To Sleep (seriously, it's 2 a.m.)
 * @param {page} object - Passing page
 * @param {'element'} object - Passing object
 */

export default async function breaker(page,element) {
    let log= await import ('../../functions.js'); 
    log = (log).default;
    log(`${element.purpose} - ${element.selector}`, "info");
    await page.goto(element.selector, { waitUntil: 'load', timeout: 0 });
}