import excel2csv from 'excel2csv';

export async function fetchExcel(param) {
    let options = {
        sheetIndex: 0, // optional, 0-based index of the Excel sheet to be converted to CSV (default is 0)
        //sheetName, // optional, sheet name in the Excel file to be converted to CSV
        writeCsv: false, // if true, the output will be written to a file, otherwise will be returned by the function
    }
    //temp 
    let data;
    try {
        data = (await excel2csv.convert(`Activity_Scripts/${param}`, options)).split('\n');
        return data;
    } catch (error) {
        log(error, 'err');
        return [];
    }

}