import log from '../functions.js';

//#region Storing results
export async function SQLInsert(db,params) {
    let DC ="";
    if (params.CreateTime) {
        DC = `CreateTime=${params.CreateTime},`
    }
    //format string
    params = {
        Id: params.Id || 0,
        RelativeStorage: params.Id || 0,
        IncidentLog: params.IncidentLog || "",
        Created: params.Created || 1,
        CreateTime: Date.now(),
        StayTime: params.StayTime || 0,
        DateLastChanged: Date.now(),
        VPNreferenc: params.VPNreferenc || 0
    }
    let sql = `UPDATE [Mainframe] set
    RelativeStorage=${params.RelativeStorage},
    IncidentLog='${params.IncidentLog}',
    Created=${params.Created},
    StayTime=${params.StayTime},
    DateLastChanged=${params.DateLastChanged},
    ${DC}
    VPNreferenc=${params.VPNreferenc}
    Where Id=${params.Id};`
    let result;
    try {
        result = db.prepare(sql).run();
        log(`Successfuly stored: ${params.Id}`, 'info');
    } catch (error) {
        log(error, 'err');
    }
}
//#endregion

