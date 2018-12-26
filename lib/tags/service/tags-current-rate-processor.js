"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const postsRepository = require('../../posts/posts-repository');
const tagsRepository = require('../../tags/repository/tags-repository');
class TagsCurrentRateProcessor {
    static process(batchSize = 500) {
        return __awaiter(this, void 0, void 0, function* () {
            let offset = 0;
            const tagToRate = {};
            while (true) {
                const posts = yield postsRepository.findAllWithTagsForTagCurrentRate(offset, batchSize);
                if (posts.length === 0) {
                    break;
                }
                this.addDataToTagToRate(posts, tagToRate);
                yield tagsRepository.updateTagsCurrentRates(tagToRate);
                offset += batchSize;
            }
        });
    }
    static addDataToTagToRate(posts, tagToRate) {
        posts.forEach((post) => {
            const oneTagRate = this.getOneTagRate(post);
            post.entity_tags.forEach((title) => {
                if (!tagToRate[title]) {
                    tagToRate[title] = 0;
                }
                tagToRate[title] += oneTagRate;
            });
        });
    }
    static getOneTagRate(post) {
        return +(post.current_rate / post.entity_tags.length).toFixed(10);
    }
}
module.exports = TagsCurrentRateProcessor;
