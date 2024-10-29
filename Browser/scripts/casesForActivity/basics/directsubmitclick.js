/**
 * Press on the first submit element
 *
 * @param {page} object - Passing page
 * @param {'element'} object - Passing object
 */

export default async function directclick(page,element,user,cursor) {
    let log= await import ('../../functions.js'); 
    log = (log).default;
    try {
        await cursor.click('[type="submit"]');
        log(`Success ${element.purpose}`, 'info');
    } catch (error) {
        log(`Failed ${element.purpose}`, 'warn');
    }
}