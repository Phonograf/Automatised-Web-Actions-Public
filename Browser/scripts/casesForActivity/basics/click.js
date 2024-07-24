/**
 * Press on the element
 *
 * @param {page} object - Passing page
 * @param {'element'} object - Passing object
 */

export default async function waitandpress(page,element) {
    try {
        let log= await import ('../../functions.js'); 
        log = (log).default;
        await page.waitForSelector(element.selector);
        //await cursor.move(selector);
        await cursor.click(element.selector);
        log(`MS_action ${element.purpose}`, 'info');
    } catch (error) {
        log(`Error on ${element.purpose} - ${error.name}`, 'err');
    }
}