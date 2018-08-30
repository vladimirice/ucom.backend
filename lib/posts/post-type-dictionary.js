const TYPE__MEDIA_POST = 1;
const TYPE__OFFER = 2;


class PostTypeDictionary {
  static getTypeMediaPost() {
    return TYPE__MEDIA_POST;
  }

  static getTypeOffer() {
    return TYPE__OFFER;
  }
}

module.exports = PostTypeDictionary;