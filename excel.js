const Excel = require("exceljs");
const xlsx = require('xlsx');
var _ = { map: require('lodash.map') };
module.exports = {
    /**
     * 处理excel文件
     * @param  {object} file excel文件对象
     */
    async parseExcel({ file = null }) {
        let rv = {
            code: -1,
            rows: []
        };
        try {
            let exists = $fs.existsSync($path.join(process.cwd(), file));
            if (!exists) return;

            let ws = xlsx.readFile($path.join(process.cwd(), file));
            let xlsxData = _.map(ws.Sheets, function (sheet = xlsx.WorkSheet, name = "") {
                var flag = { header: 1, raw: true, comment: true };
                return xlsx.utils.sheet_to_json(sheet, flag);
            });

            rv.rows = xlsxData;
            rv.code = 0;
        } catch (e) {
            global.logger.error(e);
        } finally {
            return rv;
        }
    },
    async parseExcelTransformKeyValueArray({ data = [], content_rows_index = 0 }) {
        let rv = {
            code: -1,
            rows: []
        };
        try {
            if (!data[content_rows_index] || data.length < content_rows_index + 1 || data[content_rows_index].length < 1) return;
            let headerLabel = data[content_rows_index];
            let returnData = [];
            for (let key in data) {
                if (key <= content_rows_index || !data[key] || data[key].length < 1) continue;
                let targetData = data[key];

                let obj = {};
                headerLabel.map((v, i) => {
                    obj[v] = targetData[i];
                });
                returnData.push(obj);
            }

            rv.rows = returnData;
            rv.code = 0;
        } catch (e) {
            global.logger.error(e);
        } finally {
            return rv;
        }
    }
};
