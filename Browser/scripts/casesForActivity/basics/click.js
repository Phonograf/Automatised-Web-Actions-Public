/**
 * Press on the element
 *
 * @param {page} object - Passing page
 * @param {'element'} object - Passing object
 * @param {'user'} object - Passing user
 * @param {'cursor'} object - Passing cursor
 */

export default async function waitandpress(page,element,user,cursor) {
    let log= await import ('../../functions.js'); 
    log = (log).default;
    try {
        await page.waitForSelector(element.selector);
        //await cursor.move(selector);
        await cursor.click(element.selector);
        log(`MS_action ${element.purpose}`, 'info');
    } catch (error) {
        log(`Error on ${element.purpose} - ${error.name}`, 'err');
        console.log(error);
    }
}