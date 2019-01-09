"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const requestHelper = require('../integration/helpers').Req;
const responseHelper = require('../integration/helpers').Res;
const ContentTypeDictionary = require('ucom-libs-social-transactions').ContentTypeDictionary;
const request = require('supertest');
const server = require('../../app');
const _ = require('lodash');
class PostsGenerator {
    /**
     *
     * @param {Object} wallOwner
     * @param {Object} directPostAuthor
     * @param {number} mul
     * @return {Promise<number[]>}
     */
    static generateUsersPostsForUserWall(wallOwner, directPostAuthor, mul = 1) {
        return __awaiter(this, void 0, void 0, function* () {
            const promises = [];
            for (let i = 0; i < mul; i += 1) {
                promises.push(this.createMediaPostByUserHimself(wallOwner));
                promises.push(this.createPostOfferByUserHimself(wallOwner));
                promises.push(this.createUserDirectPostForOtherUser(directPostAuthor, wallOwner));
            }
            const postsIds = yield Promise.all(promises);
            return postsIds.sort();
        });
    }
    /**
     *
     * @param {number} orgId
     * @param {Object} orgAuthor
     * @param {Object} directPostAuthor
     * @param {number} mul
     * @return {Promise<void>}
     */
    static generateOrgPostsForWall(orgId, orgAuthor, directPostAuthor, mul = 1) {
        return __awaiter(this, void 0, void 0, function* () {
            const promises = [];
            for (let i = 0; i < mul; i += 1) {
                promises.push(this.createMediaPostOfOrganization(orgAuthor, orgId)); // User himself creates posts of organization
                promises.push(this.createPostOfferOfOrganization(orgAuthor, orgId)); // User himself creates posts of organization
                promises.push(this.createDirectPostForOrganization(directPostAuthor, orgId, null, false, true)); // Somebody creates direct post on organization wall
            }
            const postsIds = yield Promise.all(promises);
            return postsIds.sort();
        });
    }
    /**
     *
     * @param {Object} user
     * @param {number} orgId
     * @param {Object} values
     * @return {Promise<number>}
     */
    static createMediaPostOfOrganization(user, orgId, values = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            const defaultValues = {
                title: 'Extremely new post',
                description: 'Our super post description',
                leading_text: 'extremely leading text',
                post_type_id: 1,
            };
            const newPostFields = _.defaults(values, defaultValues);
            const res = yield request(server)
                .post(requestHelper.getPostsUrl())
                .set('Authorization', `Bearer ${user.token}`)
                .field('title', newPostFields['title'])
                .field('description', newPostFields['description'])
                .field('post_type_id', newPostFields['post_type_id'])
                .field('leading_text', newPostFields['leading_text'])
                .field('organization_id', orgId);
            responseHelper.expectStatusOk(res);
            return +res.body.id;
        });
    }
    /**
     *
     * @param {Object} user
     * @param {number} orgId
     * @returns {Promise<number>}
     */
    static createPostOfferOfOrganization(user, orgId) {
        return __awaiter(this, void 0, void 0, function* () {
            const newPostFields = {
                title: 'Extremely new post',
                description: 'Our super post description',
                leading_text: 'extremely leading text',
                user_id: user.id,
                post_type_id: ContentTypeDictionary.getTypeOffer(),
                current_rate: '0.0000000000',
                current_vote: 0,
                action_button_title: 'TEST_BUTTON_CONTENT',
                organization_id: orgId,
            };
            const res = yield request(server)
                .post(requestHelper.getPostsUrl())
                .set('Authorization', `Bearer ${user.token}`)
                .field('title', newPostFields['title'])
                .field('description', newPostFields['description'])
                .field('leading_text', newPostFields['leading_text'])
                .field('user_id', newPostFields['user_id'])
                .field('post_type_id', newPostFields['post_type_id'])
                .field('current_rate', newPostFields['current_rate'])
                .field('current_vote', newPostFields['current_vote'])
                .field('action_button_title', newPostFields['action_button_title'])
                .field('organization_id', newPostFields['organization_id']);
            responseHelper.expectStatusOk(res);
            return +res.body.id;
        });
    }
    /**
     * @param {Object} repostAuthor
     * @param {number} postId
     * @param {number} expectedStatus
     * @return {Promise<void>}
     *
     */
    static createRepostOfUserPost(repostAuthor, postId, expectedStatus = 201) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield request(server)
                .post(requestHelper.getCreateRepostUrl(postId))
                .set('Authorization', `Bearer ${repostAuthor.token}`)
                .field('description', 'hello from such strange one');
            responseHelper.expectStatusToBe(res, expectedStatus);
            return +res.body.id;
        });
    }
    static createUserPostAndRepost(postAuthor, repostAuthor) {
        return __awaiter(this, void 0, void 0, function* () {
            const postId = yield this.createMediaPostByUserHimself(postAuthor);
            const repostId = yield this.createRepostOfUserPost(repostAuthor, postId);
            return {
                postId,
                repostId,
            };
        });
    }
    /**
     *
     * @param {Object} postAuthor
     * @param {Object} repostAuthor
     * @return {Promise<{parentPostId: number, repostId: void}>}
     */
    static createNewPostWithRepost(postAuthor, repostAuthor) {
        return __awaiter(this, void 0, void 0, function* () {
            const parentPostId = yield this.createMediaPostByUserHimself(postAuthor);
            const repostId = yield this.createRepostOfUserPost(repostAuthor, parentPostId);
            return {
                parentPostId,
                repostId,
            };
        });
    }
    static createManyDefaultMediaPostsByUserHimself(user, amount) {
        return __awaiter(this, void 0, void 0, function* () {
            const promises = [];
            for (let i = 0; i < amount; i += 1) {
                promises.push(this.createMediaPostByUserHimself(user));
            }
            return Promise.all(promises);
        });
    }
    static createManyMediaPostsOfOrganization(user, orgId, amount) {
        return __awaiter(this, void 0, void 0, function* () {
            const promises = [];
            for (let i = 0; i < amount; i += 1) {
                promises.push(this.createMediaPostOfOrganization(user, orgId));
            }
            return Promise.all(promises);
        });
    }
    /**
     *
     * @param {Object} user
     * @param {Object} values
     * @returns {Promise<number>}
     */
    static createMediaPostByUserHimself(user, values = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            const defaultValues = {
                title: 'Extremely new post',
                description: 'Our super post description',
                leading_text: 'extremely leading text',
                post_type_id: ContentTypeDictionary.getTypeMediaPost(),
                user_id: user.id,
                current_rate: 0.0000000000,
                current_vote: 0,
            };
            const newPostFields = _.defaults(values, defaultValues);
            const res = yield request(server)
                .post(requestHelper.getPostsUrl())
                .set('Authorization', `Bearer ${user.token}`)
                .field('title', newPostFields['title'])
                .field('description', newPostFields['description'])
                .field('leading_text', newPostFields['leading_text'])
                .field('post_type_id', newPostFields['post_type_id'])
                .field('user_id', newPostFields['user_id'])
                .field('current_rate', newPostFields['current_rate'])
                .field('current_vote', newPostFields['current_vote']);
            responseHelper.expectStatusOk(res);
            return +res.body.id;
        });
    }
    /**
     *
     * @param {Object} user
     * @return {Promise<number>}
     */
    static createPostOfferByUserHimself(user) {
        return __awaiter(this, void 0, void 0, function* () {
            const newPostFields = {
                title: 'Extremely new post',
                description: 'Our super post description',
                leading_text: 'extremely leading text',
                user_id: user.id,
                post_type_id: ContentTypeDictionary.getTypeOffer(),
                current_rate: '0.0000000000',
                current_vote: 0,
                action_button_title: 'TEST_BUTTON_CONTENT',
            };
            const res = yield request(server)
                .post(requestHelper.getPostsUrl())
                .set('Authorization', `Bearer ${user.token}`)
                .field('title', newPostFields['title'])
                .field('description', newPostFields['description'])
                .field('leading_text', newPostFields['leading_text'])
                .field('user_id', newPostFields['user_id'])
                .field('post_type_id', newPostFields['post_type_id'])
                .field('current_rate', newPostFields['current_rate'])
                .field('current_vote', newPostFields['current_vote'])
                .field('action_button_title', newPostFields['action_button_title']);
            responseHelper.expectStatusOk(res);
            return +res.body.id;
        });
    }
    /**
     * @param {Object} myself
     * @param {Object} wallOwner
     * @param {string|null} givenDescription
     * @param {boolean} withImage
     * @return {Promise<void>}
     *
     */
    static createUserDirectPostForOtherUser(myself, wallOwner, givenDescription = null, withImage = false) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = requestHelper.getUserDirectPostUrl(wallOwner);
            return this.createDirectPost(url, myself, givenDescription, withImage);
        });
    }
    /**
     * @param {Object} myself
     * @param {number} targetOrgId
     * @param {string|null} givenDescription
     * @param {boolean} withImage
     * @param {boolean} idOnly
     * @return {Promise<number>}
     *
     */
    static createDirectPostForOrganization(myself, targetOrgId, givenDescription = null, withImage = false, idOnly = false) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = requestHelper.getOrgDirectPostUrl(targetOrgId);
            return this.createDirectPost(url, myself, givenDescription, withImage, idOnly);
        });
    }
    static createDirectPost(url, myself, givenDescription = null, withImage = false, idOnly = false) {
        return __awaiter(this, void 0, void 0, function* () {
            const postTypeId = ContentTypeDictionary.getTypeDirectPost();
            const description = givenDescription || 'sample direct post description';
            const req = request(server)
                .post(url);
            const fields = {
                description,
                post_type_id: postTypeId,
            };
            requestHelper.addAuthToken(req, myself);
            requestHelper.addFieldsToRequest(req, fields);
            if (withImage) {
                requestHelper.addSampleMainImageFilename(req);
            }
            const res = yield req;
            responseHelper.expectStatusOk(res);
            if (idOnly) {
                return res.body.id;
            }
            return res.body;
        });
    }
}
module.exports = PostsGenerator;
