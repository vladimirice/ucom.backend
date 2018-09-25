const GROUP__CONTENT_CREATION = 1;
const GROUP__CONTENT_INTERACTION = 1;

class ActivityGroupDictionary {

  /**
   *
   * @return {number}
   */
  static getGroupContentCreation() {
    return GROUP__CONTENT_CREATION;
  }

  /**
   *
   * @return {number}
   */
  static getGroupContentInteraction() {
    return GROUP__CONTENT_INTERACTION;
  }
}

module.exports = ActivityGroupDictionary;