"use strict";
const knex = require('../../../config/knex');
class TagsRepository {
    static getWhenThenString(title, currentRate) {
        return ` WHEN title = '${title}' THEN ${currentRate}`;
    }
    static async updateTagsCurrentRates(whenThenString, titles) {
        const processedTitles = titles.map(item => `'${item}'`);
        const sql = `
      UPDATE tags
        SET current_rate =
          CASE
            ${whenThenString}
            -- NO ELSE BECAUSE THERE IS NO DEFAULT VALUE
          END
        WHERE title IN (${processedTitles.join(', ')})
    `;
        return knex.raw(sql);
    }
    /**
     *
     * @param {Object} tags
     * @param {Transaction} trx
     */
    static async createNewTags(tags, trx) {
        const data = await trx(this.getTableName()).returning(['id', 'title']).insert(tags);
        const res = {};
        data.forEach((item) => {
            res[item.title] = +item.id;
        });
        return res;
    }
    static async findOneByTitle(tagTitle) {
        const data = await knex(this.getTableName())
            .select(['id', 'title', 'current_rate', 'created_at'])
            .where('title', tagTitle)
            .first();
        if (!data) {
            return null;
        }
        data.id = +data.id;
        data.current_rate = +data.current_rate;
        return data;
    }
    /**
     *
     * @param {string[]} titles
     */
    static async findAllTagsByTitles(titles) {
        const data = await knex(this.getTableName())
            .select(['id', 'title'])
            .whereIn('title', titles);
        const res = {};
        data.forEach((item) => {
            res[item.title] = +item.id;
        });
        return res;
    }
    // noinspection JSUnusedGlobalSymbols
    static async getAllTags() {
        return knex(this.getTableName()).select('*');
    }
    /**
     * @return string
     * @private
     */
    static getTableName() {
        return 'tags';
    }
}
module.exports = TagsRepository;
