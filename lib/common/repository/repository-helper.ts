import { NumberToNumberCollection } from '../interfaces/common-types';

class RepositoryHelper {
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
}

export = RepositoryHelper;
