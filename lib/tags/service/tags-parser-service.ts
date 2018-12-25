const _ = require('lodash');

const TAG_REGEX = /#[a-zA-z]([a-zA-Z0-9]*)/gm;

class TagsParserService {
  static parseTags(inputString: string): string[] {
    const tagsArray: string[] | null = inputString.match(TAG_REGEX);

    if (tagsArray === null) {
      return [];
    }

    return _.uniq(tagsArray.map(item => item.replace('#', '')));
  }
}

export = TagsParserService;
