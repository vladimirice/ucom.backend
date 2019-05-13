import { InsertUpdateHelperFields } from '../../interfaces/options-dto';

class InsertUpdateRepositoryHelper {
  public static getInsertManyRawSqlFromIndexed(data: any, tableName: string): string {
    const keys = Object.keys(data[0]);

    const values: any = [];
    for (const object of data) {
      const m: any = [];

      for (const field of keys) {
        const value = object[field];
        if (typeof value === 'string') {
          m.push(`'${value}'`);
        } else {
          m.push(value);
        }
      }

      values.push(`(${m.join(', ')})`);
    }

    const valuesString = values.join(', ');

    return `
      INSERT INTO ${tableName} (${keys}) VALUES ${valuesString}
    `;
  }

  public static getUpsertManyRawSql(
    manyItems: any[],
    tableName: string,
    fields: InsertUpdateHelperFields,
  ): string {
    const manyAccountsValues: any[] = [];
    for (const oneItem of manyItems) {
      const oneAccountValues: any[] = [];
      for (const index in fields) {
        if (!fields.hasOwnProperty(index)) {
          continue;
        }

        const oneFieldSet = fields[index];

        if (oneFieldSet.type === 'string') {
          oneAccountValues.push(`'${oneItem[oneFieldSet.key]}'`);
        } else {
          oneAccountValues.push(oneItem[oneFieldSet.key]);
        }
      }

      manyAccountsValues.push(`(${oneAccountValues.join(', ')})`);
    }

    const arrayToSet: string[] = [];
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

export = InsertUpdateRepositoryHelper;
