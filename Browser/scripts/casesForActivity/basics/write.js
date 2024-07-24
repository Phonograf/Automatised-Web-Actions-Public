/**
 * Write in the element if it supports it
 *
 * @param {page} object - Passing page
 * @param {'element'} object - Passing object
 */

export default async function write(page,element) {
    let log= await import ('../../functions.js'); 
    log = (log).default;
    let to_write = element.comment;
    if (element.comment == "fromuser") {
        log('user case', 'info');
        switch (element.purpose) {
            case "nickname":
                to_write = user.nickname;
                break;
            case "email":
                to_write = user.email;
                break;
            case "password":
                to_write = user.password;
                break;
        }
    }

    await page.typeHuman(`${element.selector}`,to_write, {
        backspaceMaximumDelayInMs: 750 * 2,
        backspaceMinimumDelayInMs: 750,
        keyboardLayout: "en",
        keyboardLayouts: {
            en: [
                ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-"],
                ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p", "["],
                ["a", "s", "d", "f", "g", "h", "j", "k", "l", ";", "'"],
                ["z", "x", "c", "v", "b", "n", "m", ",", ".", "/"],
            ],
        },
        maximumDelayInMs: 650,
        minimumDelayInMs: 150,
        typoChanceInPercent: 0,
        chanceToKeepATypoInPercent: 0
    });
    log(`KB_action ${element.purpose}`, 'info');
}