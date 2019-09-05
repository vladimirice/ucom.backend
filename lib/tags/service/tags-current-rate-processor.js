"use strict";
const ucom_libs_common_1 = require("ucom.libs.common");
const TagsRepository = require("../repository/tags-repository");
const PostsRepository = require("../../posts/posts-repository");
class TagsCurrentRateProcessor {
    static async process(batchSize = 500) {
        let offset = 0;
        const tagToRate = {};
        // eslint-disable-next-line no-constant-condition
        while (true) {
            const posts = await PostsRepository.findAllWithTagsForTagCurrentRate(offset, batchSize);
            if (posts.length === 0) {
                break;
            }
            this.addDataToTagToRate(posts, tagToRate);
            offset += batchSize;
        }
        await this.processTagsStatsAndUpdateTheirStats(tagToRate);
        await TagsRepository.resetTagsCurrentStats(Object.keys(tagToRate));
    }
    static async processTagsStatsAndUpdateTheirStats(tagToRate) {
        const batchSize = 100;
        let counter = 0;
        let whenThenRateString = ' ';
        let whenThenPostsAmountString = ' ';
        let whenThenMediaPostsAmountString = ' ';
        let whenThenDirectPostsAmountString = ' ';
        let processedTitles = [];
        const promises = [];
        for (const tagTitle in tagToRate) {
            if (!tagToRate.hasOwnProperty(tagTitle)) {
                continue;
            }
            const current = tagToRate[tagTitle];
            current.currentRate = +(current.ratePerPost / current.postsAmount).toFixed(10);
            whenThenRateString +=
                TagsRepository.getWhenThenString(current.title, current.currentRate);
            whenThenPostsAmountString +=
                TagsRepository.getWhenThenString(current.title, current.postsAmount);
            whenThenMediaPostsAmountString +=
                TagsRepository.getWhenThenString(current.title, current.mediaPostsAmount);
            whenThenDirectPostsAmountString +=
                TagsRepository.getWhenThenString(current.title, current.directPostsAmount);
            processedTitles.push(current.title);
            counter += 1;
            if (counter % batchSize === 0) {
                promises.push(TagsRepository.updateTagsCurrentStats(whenThenRateString, whenThenPostsAmountString, whenThenMediaPostsAmountString, whenThenDirectPostsAmountString, processedTitles));
                counter = 0;
                whenThenRateString = ' ';
                whenThenPostsAmountString = ' ';
                whenThenMediaPostsAmountString = ' ';
                whenThenDirectPostsAmountString = ' ';
                processedTitles = [];
            }
        }
        if (whenThenRateString !== ' ') {
            promises.push(TagsRepository.updateTagsCurrentStats(whenThenRateString, whenThenPostsAmountString, whenThenMediaPostsAmountString, whenThenDirectPostsAmountString, processedTitles));
        }
        await Promise.all(promises);
    }
    static addDataToTagToRate(posts, tagToRate) {
        posts.forEach((post) => {
            const oneTagRatePerPost = this.getOneTagRatePerPost(post);
            post.entity_tags.forEach((title) => {
                if (!tagToRate[title]) {
                    tagToRate[title] = {
                        title,
                        ratePerPost: 0,
                        postsAmount: 0,
                        mediaPostsAmount: 0,
                        directPostsAmount: 0,
                        currentRate: 0,
                    };
                }
                switch (post.post_type_id) {
                    case ucom_libs_common_1.ContentTypesDictionary.getTypeMediaPost():
                        tagToRate[title].mediaPostsAmount += 1;
                        break;
                    case ucom_libs_common_1.ContentTypesDictionary.getTypeDirectPost():
                        tagToRate[title].directPostsAmount += 1;
                        break;
                    default:
                    // do nothing
                }
                tagToRate[title].ratePerPost += oneTagRatePerPost;
                tagToRate[title].postsAmount += 1;
            });
        });
    }
    static getOneTagRatePerPost(post) {
        return +(post.current_rate / post.entity_tags.length).toFixed(10);
    }
}
module.exports = TagsCurrentRateProcessor;
