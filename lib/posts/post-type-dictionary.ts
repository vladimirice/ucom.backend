const TYPE__MEDIA_POST = 1;
const TYPE__OFFER = 2;

/**
 * @deprecated
 * @see uos-app-transaction ContentTypeDictionary
 */
class PostTypeDictionary {
  static getTypeMediaPost() {
    return TYPE__MEDIA_POST;
  }

  static getTypeOffer() {
    return TYPE__OFFER;
  }
}

export = PostTypeDictionary;
