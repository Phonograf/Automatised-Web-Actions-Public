/**
 * Go To Sleep (seriously, it's 2 a.m.)
 * @param {page} object - Passing page
 * @param {'element'} object - Passing object
 */
//import log from '../../functions.js';

export default async function breaker(page, element) {
    let log= await import ('../../functions.js'); 
    log = (log).default;
    log(`${element.purpose} - ${element.selector}`, "info");
    function Rand(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    //example .G:nth-child(2) > .df.df--hover.df--clickable:
    await waitandpress(`${element.selector}:nth-child(${Rand(1, 7)})`, element.purpose);
}