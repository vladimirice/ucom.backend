"use strict";
const _ = require('lodash');
const TAG_REGEX = /#[a-zA-z]([a-zA-Z0-9]*)/gm;
const TAG_MAX_LENGTH = 2048;
class TagsParserService {
    static parseTags(inputString) {
        const tagsArray = inputString.match(TAG_REGEX);
        if (tagsArray === null) {
            return [];
        }
        const uniqueValues = _.uniq(tagsArray.map(item => item.replace('#', '')));
        return uniqueValues.filter(item => item.length < TAG_MAX_LENGTH);
    }
}
module.exports = TagsParserService;
