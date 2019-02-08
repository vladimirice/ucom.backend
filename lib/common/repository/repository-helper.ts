class RepositoryHelper {
  public static convertStringFieldsToNumbers(model: any, repository: any) {
    const fields: string[] = repository.getNumericalFields();

    fields.forEach((field) => {
      model[field] = +model[field];
    });
  }
}

export = RepositoryHelper;
