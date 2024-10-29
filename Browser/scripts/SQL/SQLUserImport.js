import log from '../functions.js';

//#region SQL User Extraction
//TBC
export async function SQLUserExtraction(db,id) {
    log(`Extracting user data: ${id}`, 'info');
    let sql = `SELECT * from [Mainframe] WHERE Id=${id};`;
    let user;
    try {
        user = db.prepare(sql).all();
        //Report and check if entry wasn't loaded (undefined for user[0] isn't possible in case if the line exists)
        log(`Successfuly extracted: ${user[0].Nickname}`, 'done');
    } catch (error) {
        log(error, 'err');
        log(`Requested entry may not exist`,'info');
        throw new Error("ShutDown");
    }
    return user
}


//#endregion
