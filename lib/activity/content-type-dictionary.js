const TYPE__MEDIA_POST   = 1;
const TYPE__OFFER        = 2;
const TYPE__COMMENT      = 3;
const TYPE__ORGANIZATION = 4;

class ContentTypeDictionary {

  /**
   *
   * @return {number}
   */
  static getTypeOrganization() {
    return TYPE__ORGANIZATION;
  }
}

module.exports = ContentTypeDictionary;