import { NumberToNumberCollection } from '../interfaces/common-types';

import { CurrentParams } from '../../stats/interfaces/dto-interfaces';

import knex = require('../../../config/knex');

class RepositoryHelper {
  public static hydrateObjectForManyEntities(data: any, objectPrefix: string, delimiter = '__') {
    data.forEach((item) => {
      this.hydrateOneObject(item, objectPrefix, delimiter);
    });
  }

  private static hydrateOneObject(data: any, objectPrefix: string, delimiter = '__') {
    const obj: any = {};

    const fieldsToDelete: string[] = [];
    for (const field in data) {
      if (!data.hasOwnProperty(field)) {
        continue;
      }

      if (field.includes(objectPrefix)) {
        const objField = field.replace(objectPrefix, '');
        obj[objField] = data[field];

        fieldsToDelete.push(field);
      }
    }

    fieldsToDelete.forEach((field) => {
      delete data[field];
    });

    const objectKey = objectPrefix.replace(delimiter, '');
    data[objectKey] = obj;
  }

  // It is required because big int fields from Postgresql are represented as string
  // It is supposed that js numerical limit will not be exceeded before a bigint support feature of nodejs core will be created
  public static convertStringFieldsToNumbers(model: any, fields: string[]) {
    fields.forEach((field) => {
      model[field] = +model[field];
    });
  }

  public static splitAggregates(
    row: any,
    delimiter: string = '__',
  ): NumberToNumberCollection {
    const aggregates: NumberToNumberCollection = {};

    row.array_agg.forEach((aggregate) => {
      const [type, value] = aggregate.split(delimiter);
      aggregates[type] = +value;
    });

    return aggregates;
  }

  public static async updateManyRowsByNumberToNumber(
    toProcess: any,
    params: CurrentParams,
    batchSize: number = 100,
  ): Promise<void> {
    let counter = 0;
    let whenThenString = ' ';
    let filterValues: number[] = [];

    const promises: Promise<any>[] = [];
    for (const entityId in toProcess) {
      if (!toProcess.hasOwnProperty(entityId)) {
        continue;
      }

      whenThenString += this.getWhenNumberThenNumber(
        params.whenFieldName,
        +entityId,
        toProcess[entityId][params.thenFieldNameFromSet],
      );

      filterValues.push(+entityId);
      counter += 1;

      if (counter % batchSize === 0) {
        promises.push(
          this.updateTableValuesByWhenThen(
            params.tableName,
            params.fieldNameToSet,
            whenThenString,
            params.whenFieldName,
            filterValues,
          ),
        );
        counter = 0;
        whenThenString = ' ';
        filterValues = [];
      }
    }

    if (whenThenString !== ' ') {
      promises.push(
        this.updateTableValuesByWhenThen(
          params.tableName,
          params.fieldNameToSet,
          whenThenString,
          params.whenFieldName,
          filterValues,
        ),
      );
    }

    // #task - also implement promises batch
    await Promise.all(promises);
  }

  private static getWhenNumberThenNumber(
    fieldName: string,
    whenValue: number,
    thenValue: number,
  ): string {
    return ` WHEN ${fieldName} = ${whenValue} THEN ${thenValue}`;
  }

  private static async updateTableValuesByWhenThen(
    tableName:        string,
    fieldNameToSet:   string,
    whenThenString:   string,
    filterFieldName:  string,
    filterValues:     number[],
  ): Promise<any> {
    const sql = `
      UPDATE ${tableName}
        SET ${fieldNameToSet} = CASE ${whenThenString} END,
        updated_at = NOW()
        WHERE ${filterFieldName} IN (${filterValues.join(', ')})
    `;

    await knex.raw(sql);
  }
}

export = RepositoryHelper;
