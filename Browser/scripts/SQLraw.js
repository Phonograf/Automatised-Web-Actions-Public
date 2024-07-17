import log from './functions.js';

//#region SQL User Extraction
//TBC
export async function SQLRaw(db,sql) {
    log(`Writing raw SQL: ${sql}`, 'info');
    let res;
    try {
        res = db.prepare(sql).all();
        log(`Successfuly executed`, 'done');
    } catch (error) {
        log(error, 'err');
        throw new Error("ShutDown");
    }
    return res
}


//#endregion
