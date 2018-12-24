"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const knex = require('../../../config/knex');
class TagsRepository {
    /**
     *
     * @param {Object} tags
     * @param {Transaction} trx
     */
    static createNewTags(tags, trx) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield trx(this.getTableName()).returning(['id', 'title']).insert(tags);
            const res = {};
            data.forEach((item) => {
                res[item.title] = +item.id;
            });
            return res;
        });
    }
    /**
     * @param {string} tagTitle
     */
    static findOneByTitle(tagTitle) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield knex(this.getTableName())
                .select(['id', 'title', 'created_at'])
                .where('title', tagTitle)
                .first();
            if (!data) {
                return null;
            }
            data.id = +data.id;
            return data;
        });
    }
    /**
     *
     * @param {string[]} titles
     */
    static findAllTagsByTitles(titles) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield knex(this.getTableName())
                .select(['id', 'title'])
                .whereIn('title', titles);
            const res = {};
            data.forEach((item) => {
                res[item.title] = +item.id;
            });
            return res;
        });
    }
    // noinspection JSUnusedGlobalSymbols
    static getAllTags() {
        return __awaiter(this, void 0, void 0, function* () {
            return knex(this.getTableName()).select('*');
        });
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
