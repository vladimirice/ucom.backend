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
}

module.exports = UpdateManyToManyHelper;