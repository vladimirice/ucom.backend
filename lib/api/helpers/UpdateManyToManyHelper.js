class UpdateManyToManyHelper {
  /**
   *
   * @param {Object[]} source
   * @param {Object[]} updated
   * @return {Object[]}
   */
  static getCreateDeleteOnlyDelta(source, updated) {
    const added = updated.filter((updatedItem) => {
      return source.find(sourceItem => sourceItem.id === updatedItem.id) === undefined
    });

    const deleted = source.filter(
      sourceItem => updated.find(updatedItem => updatedItem.id === sourceItem.id) === undefined
    );

    return {
      added,
      deleted
    };
  }

  /**
   *
   * @param {Object[]} source
   * @param {Object[]} updated
   * @return {Object[]}
   */
  static getCreateUpdateDeleteDelta(source, updated) {
    const added = updated.filter((updatedItem) => {
      if (!updatedItem['id']) {
        return true;
      }

      return source.find(sourceItem => sourceItem.id === +updatedItem.id) === undefined
    });

    const changed = updated.filter(updatedItem => {
      return source.some(sourceItem => sourceItem.id === +updatedItem.id);
    });

    const deleted = source.filter(sourceItem => {
      return !updated.some(updatedItem => +updatedItem.id === sourceItem.id);
    });

    return {
      added,
      changed,
      deleted
    };
  }
}

module.exports = UpdateManyToManyHelper;