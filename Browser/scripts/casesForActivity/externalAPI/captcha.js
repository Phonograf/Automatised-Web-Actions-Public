/**
 * Solve captcha. Make sure to put API key
 *
 * @param {page} object - Passing page
 * 
 * @returns {JSON}
 */

export default async function captcha(page,element) {
    let log= await import ('../../functions.js'); 
    log = (log).default;
    let a = await page.solveRecaptchas();
    log(`Captcha ended with ${JSON.stringify(a.solved)}`, 'info');
    return
}