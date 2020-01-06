const _ = require('lodash');

const TAG_REGEX           = /#[a-zA-Z]\w*/gm;
const TAG_MAX_LENGTH = 2048;

const USER_MENTIONS_REGEX = /@[a-z1-5]{12}/gm;

class TagsParserService {
  static parseTags(inputString: string): string[] {
    if (!inputString || inputString.length === 0) {
      return [];
    }

    const tagsArray: string[] | null = inputString.match(TAG_REGEX);

    if (tagsArray === null) {
      return [];
    }

    // eslint-disable-next-line you-dont-need-lodash-underscore/uniq
    const uniqueValues = _.uniq(
      tagsArray.map(item => item.replace('#', '').toLowerCase()),
    );

    return uniqueValues.filter(item => item.length < TAG_MAX_LENGTH);
  }

  static parseMentions(inputString: string): string[] {
    if (!inputString || inputString.length === 0) {
      return [];
    }

    const tagsArray: string[] | null = inputString.match(USER_MENTIONS_REGEX);

    if (tagsArray === null) {
      return [];
    }

    // eslint-disable-next-line you-dont-need-lodash-underscore/uniq
    return _.uniq(
      tagsArray.map(item => item.replace('@', '').toLowerCase()),
    );
  }
}

export = TagsParserService;
