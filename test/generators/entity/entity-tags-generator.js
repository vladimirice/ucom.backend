"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const postsGenerator = require('../posts-generator');
const orgsGenerator = require('../organizations-generator');
const tagHelper = require('../../integration/helpers/tags-helper');
const postsHelper = require('../../integration/helpers/posts-helper');
class EntityTagsGenerator {
    /**
     *
     * @param {Object} userVlad
     * @param {Object} userJane
     */
    static createPostsWithTags(userVlad, userJane) {
        return __awaiter(this, void 0, void 0, function* () {
            const tagsSet = [
                'summer', 'party', 'openair', 'eos', 'ether',
            ];
            const postOneTags = [
                tagsSet[0],
                tagsSet[1],
            ];
            const postTwoTags = [
                tagsSet[0],
                tagsSet[2],
                tagsSet[1],
            ];
            const janePostOneTags = [
                tagsSet[2],
                tagsSet[3],
                tagsSet[4],
            ];
            const vladPostOneId = yield postsGenerator.createMediaPostByUserHimself(userVlad, {
                description: `Hi everyone! #${postOneTags[0]} #${postOneTags[0]} is so close.
      Lets organize a #${postOneTags[1]}`,
            });
            yield tagHelper.getPostWhenTagsAreProcessed(vladPostOneId);
            const vladPostTwoId = yield postsGenerator.createMediaPostByUserHimself(userVlad, {
                description: `Hi everyone again! #${postTwoTags[0]} is so close.
      Lets organize #${postTwoTags[1]} #${postTwoTags[2]}`,
            });
            yield tagHelper.getPostWhenTagsAreProcessed(vladPostTwoId);
            const janePostOneId = yield postsGenerator.createMediaPostByUserHimself(userJane, {
                description: `Hi everyone! #${janePostOneTags[0]} is so close.
      Lets buy some #${janePostOneTags[1]} and #${janePostOneTags[2]} and #${janePostOneTags[1]}`,
            });
            const orgOneId = yield orgsGenerator.createOrgWithoutTeam(userVlad);
            yield postsGenerator.createMediaPostOfOrganization(userVlad, orgOneId, {
                description: `Hi everyone! #${tagsSet[0]} is so close`,
            });
            yield tagHelper.getPostWhenTagsAreProcessed(janePostOneId);
            yield this.createDirectPostForUserWithTags(userVlad, userJane, tagsSet[0], tagsSet[1]);
            return {
                tagsTitles: tagsSet,
                posts: {
                    total_amount: 4,
                    vlad: [
                        vladPostOneId,
                        vladPostTwoId,
                    ],
                },
            };
        });
    }
    static createDirectPostForUserWithTags(userVlad, userJane, firstTag, secondTag) {
        return __awaiter(this, void 0, void 0, function* () {
            const description = `Our super #${firstTag} post #${secondTag} description`;
            const directPost = yield postsHelper.requestToCreateDirectPostForUser(userVlad, userJane, description);
            return tagHelper.getPostWhenTagsAreProcessed(directPost.id);
        });
    }
}
module.exports = EntityTagsGenerator;
