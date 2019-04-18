"use strict";
class InsertUpdateRepositoryHelper {
    static getUpsertManyRawSql(manyItems, tableName, fields) {
        const manyAccountsValues = [];
        for (const oneItem of manyItems) {
            const oneAccountValues = [];
            for (const index in fields) {
                if (!fields.hasOwnProperty(index)) {
                    continue;
                }
                const oneFieldSet = fields[index];
                if (oneFieldSet.type === 'string') {
                    oneAccountValues.push(`'${oneItem[oneFieldSet.key]}'`);
                }
                else {
                    oneAccountValues.push(oneItem[oneFieldSet.key]);
                }
            }
            manyAccountsValues.push(`(${oneAccountValues.join(', ')})`);
        }
        const arrayToSet = [];
        for (const key in fields) {
            if (!fields.hasOwnProperty(key)) {
                continue;
            }
            arrayToSet.push(`${key} = EXCLUDED.${key}`);
        }
        return `
        INSERT INTO ${tableName}
      (${Object.keys(fields).join(', ')})
    VALUES ${manyAccountsValues.join(',\n')}
    ON CONFLICT (account_name) DO
    UPDATE
        SET ${arrayToSet.join(',\n')},
        updated_at = NOW()
    ;
    `;
    }
}
module.exports = InsertUpdateRepositoryHelper;
