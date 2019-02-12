import { NumberToNumberCollection } from '../interfaces/common-types';

class RepositoryHelper {
  public static convertStringFieldsToNumbers(model: any, repository: any) {
    const fields: string[] = repository.getNumericalFields();

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
