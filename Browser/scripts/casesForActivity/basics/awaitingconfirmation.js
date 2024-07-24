/**
 * Awaiting selector for 15 seconds OR flexible time UP TO 30 seconds
 *
 * @param {page} object - Passing page
 * @param {'element'} object - Passing object
 */

export default async function awaitingconfirmation(page,element) {
    let log= await import ('../../functions.js'); 
    log = (log).default;
    log(`${element.purpose} waiting for ${element.selector}`, 'info');
    let AwaitingSuccess = new Promise(async (resolve, reject) => {
        let a = setTimeout(() => log("10 seconds passed", "info"), 10000);
        let timetowait
        try {
            timetowait = Number(element.comment) || 15000
        } catch (error) {
            timetowait = 15000;
        }
        setTimeout(() => { reject("Missing confirmation"); }, timetowait);
        try {
            await page.waitForSelector(element.selector);
            resolve("Confirmation received");
        } catch (error) {
            reject("Error");
        }
    });

    await AwaitingSuccess
        .then(
            async result => {
                log(result, 'done');
            },
            async error => {
                log(error, 'warn');
                //Write a report
                let matter = "Doubt!";
                incLog = matter;
                if ((user.email == undefined) || user.email == null) {
                    matter = "Empty session"
                }
                log(matter, 'info')
            }
        );
}