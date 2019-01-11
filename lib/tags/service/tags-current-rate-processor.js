"use strict";
const postsRepository = require('../../posts/posts-repository');
const tagsRepository = require('../../tags/repository/tags-repository');
class TagsCurrentRateProcessor {
    static async process(batchSize = 500) {
        let offset = 0;
        const tagToRate = {};
        while (true) {
            const posts = await postsRepository.findAllWithTagsForTagCurrentRate(offset, batchSize);
            if (posts.length === 0) {
                break;
            }
            this.addDataToTagToRate(posts, tagToRate);
            offset += batchSize;
        }
        await this.processTagsStatsAndUpdateTheirRates(tagToRate);
    }
    static async processTagsStatsAndUpdateTheirRates(tagToRate) {
        const batchSize = 100;
        let counter = 0;
        let whenThenString = ' ';
        let processedTitles = [];
        const promises = [];
        for (const tagTitle in tagToRate) {
            const current = tagToRate[tagTitle];
            current.currentRate = +(current.ratePerPost / current.postsAmount).toFixed(10);
            whenThenString += tagsRepository.getWhenThenString(current.title, current.currentRate);
            processedTitles.push(current.title);
            counter += 1;
            if (counter % batchSize === 0) {
                promises.push(tagsRepository.updateTagsCurrentRates(whenThenString, processedTitles));
                counter = 0;
                whenThenString = ' ';
                processedTitles = [];
            }
        }
        if (whenThenString !== ' ') {
            promises.push(tagsRepository.updateTagsCurrentRates(whenThenString, processedTitles));
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
                        currentRate: 0,
                    };
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
