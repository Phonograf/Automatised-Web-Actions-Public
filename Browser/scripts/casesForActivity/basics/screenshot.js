/**
 * Go To Sleep (seriously, it's 2 a.m.)
 * @param {page} object - Passing page
 * @param {'element'} object - Passing object
 */

export default async function breaker(page,element) {
    let log= await import ('../../functions.js'); 
    log = (log).default;
    await page.screenshot({ path: `../DBs/sessions/${user.id}/${element.selector}.png` });
    log("Screenshot made", "info");
}

