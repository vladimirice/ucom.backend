"use strict";
const _ = require('lodash');
const TAG_REGEX = /#([a-zA-Z]+)/gm;
class TagsParserService {
    static parseTags(inputString) {
        const tagsArray = inputString.match(TAG_REGEX);
        if (tagsArray === null) {
            return [];
        }
        return _.uniq(tagsArray.map(item => item.replace('#', '')));
    }
}
module.exports = TagsParserService;