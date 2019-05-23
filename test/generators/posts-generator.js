"use strict";
const RequestHelper = require("../integration/helpers/request-helper");
const ResponseHelper = require("../integration/helpers/response-helper");
const UsersHelper = require("../integration/helpers/users-helper");
const OrganizationsGenerator = require("./organizations-generator");
const EntityImagesModelProvider = require("../../lib/entity-images/service/entity-images-model-provider");
const _ = require('lodash');
const { ContentTypeDictionary } = require('ucom-libs-social-transactions');
const request = require('supertest');
const server = RequestHelper.getApiApplication();
const entityImagesField = EntityImagesModelProvider.entityImagesColumn();
class PostsGenerator {
    /**
     *
     * @param {Object} wallOwner
     * @param {Object} directPostAuthor
     * @param {number} mul
     * @return {Promise<number[]>}
     */
    static async generateUsersPostsForUserWall(wallOwner, directPostAuthor, mul = 1) {
        const promises = [];
        for (let i = 0; i < mul; i += 1) {
            promises.push(this.createMediaPostByUserHimself(wallOwner));
            promises.push(this.createPostOfferByUserHimself(wallOwner));
            promises.push(this.createUserDirectPostForOtherUser(directPostAuthor, wallOwner));
        }
        const postsIds = await Promise.all(promises);
        return postsIds.sort();
    }
    /**
     *
     * @param {number} orgId
     * @param {Object} orgAuthor
     * @param {Object} directPostAuthor
     * @param {number} mul
     * @return {Promise<void>}
     */
    static async generateOrgPostsForWall(orgId, orgAuthor, directPostAuthor, mul = 1) {
        const promises = [];
        for (let i = 0; i < mul; i += 1) {
            promises.push(this.createMediaPostOfOrganization(orgAuthor, orgId)); // User himself creates posts of organization
            promises.push(this.createPostOfferOfOrganization(orgAuthor, orgId)); // User himself creates posts of organization
            promises.push(this.createDirectPostForOrganization(directPostAuthor, orgId, null, false, true)); // Somebody creates direct post on organization wall
        }
        const postsIds = await Promise.all(promises);
        return postsIds.sort();
    }
    /**
     *
     * @param {Object} user
     * @param {number} orgId
     * @param {Object} values
     * @return {Promise<number>}
     */
    static async createMediaPostOfOrganization(user, orgId, values = {}) {
        const defaultValues = {
            title: 'Extremely new post',
            description: 'Our super post description',
            leading_text: 'extremely leading text',
            post_type_id: 1,
        };
        const newPostFields = _.defaults(values, defaultValues);
        const res = await request(server)
            .post(RequestHelper.getPostsUrl())
            .set('Authorization', `Bearer ${user.token}`)
            .field('title', newPostFields.title)
            .field('description', newPostFields.description)
            .field('post_type_id', newPostFields.post_type_id)
            .field('leading_text', newPostFields.leading_text)
            .field('organization_id', orgId)
            .field('entity_images', '{}');
        ResponseHelper.expectStatusOk(res);
        return +res.body.id;
    }
    /**
     *
     * @param {Object} user
     * @param {number} orgId
     * @returns {Promise<number>}
     */
    static async createPostOfferOfOrganization(user, orgId) {
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
        const res = await request(server)
            .post(RequestHelper.getPostsUrl())
            .set('Authorization', `Bearer ${user.token}`)
            .field('title', newPostFields.title)
            .field('description', newPostFields.description)
            .field('leading_text', newPostFields.leading_text)
            .field('user_id', newPostFields.user_id)
            .field('post_type_id', newPostFields.post_type_id)
            .field('current_rate', newPostFields.current_rate)
            .field('current_vote', newPostFields.current_vote)
            .field('action_button_title', newPostFields.action_button_title)
            .field('organization_id', newPostFields.organization_id)
            .field(EntityImagesModelProvider.entityImagesColumn(), '{}');
        ResponseHelper.expectStatusOk(res);
        return +res.body.id;
    }
    static async createRepostWithFields(myself, postId, givenFields, expectedStatus = 201) {
        const url = RequestHelper.getCreateRepostUrl(postId);
        const fields = Object.assign({}, givenFields, { post_type_id: ContentTypeDictionary.getTypeRepost() });
        if (typeof fields[entityImagesField] === 'object') {
            fields[entityImagesField] = JSON.stringify(fields[entityImagesField]);
        }
        const req = request(server)
            .post(url);
        RequestHelper.addAuthToken(req, myself);
        RequestHelper.addFieldsToRequest(req, fields);
        const res = await req;
        ResponseHelper.expectStatusToBe(res, expectedStatus);
        return res.body;
    }
    static async createRepostOfUserPost(repostAuthor, postId, expectedStatus = 201) {
        const res = await request(server)
            .post(RequestHelper.getCreateRepostUrl(postId))
            .set('Authorization', `Bearer ${repostAuthor.token}`)
            .field('description', 'hello from such strange one');
        ResponseHelper.expectStatusToBe(res, expectedStatus);
        return +res.body.id;
    }
    static async createUserPostAndRepost(postAuthor, repostAuthor) {
        const postId = await this.createMediaPostByUserHimself(postAuthor);
        const repostId = await this.createRepostOfUserPost(repostAuthor, postId);
        return {
            postId,
            repostId,
        };
    }
    static async createUserDirectPostAndRepost(postAuthor, wallOwner, repostAuthor) {
        const postId = await this.createDirectPostForUserAndGetId(postAuthor, wallOwner);
        const repostId = await this.createRepostOfUserPost(repostAuthor, postId);
        return {
            postId,
            repostId,
        };
    }
    /**
     *
     * @param {Object} postAuthor
     * @param {Object} repostAuthor
     * @return {Promise<{parentPostId: number, repostId: void}>}
     */
    static async createNewPostWithRepost(postAuthor, repostAuthor) {
        const parentPostId = await this.createMediaPostByUserHimself(postAuthor);
        const repostId = await this.createRepostOfUserPost(repostAuthor, parentPostId);
        return {
            parentPostId,
            repostId,
        };
    }
    static async createManyDefaultMediaPostsByUserHimself(user, amount) {
        const promises = [];
        for (let i = 0; i < amount; i += 1) {
            promises.push(this.createMediaPostByUserHimself(user));
        }
        return Promise.all(promises);
    }
    static async createManyDefaultMediaPostsByDifferentUsers(amount) {
        const promises = [];
        const users = await UsersHelper.getAllSampleUsersFromDb();
        for (let i = 0; i < amount; i += 1) {
            const creatorIndex = RequestHelper.generateRandomNumber(0, users.length - 1, 0);
            if (i % 2 === 0) {
                const orgId = await OrganizationsGenerator.createOrgWithoutTeam(users[creatorIndex]);
                promises.push(this.createMediaPostOfOrganization(users[creatorIndex], orgId));
            }
            else {
                promises.push(this.createMediaPostByUserHimself(users[creatorIndex]));
            }
        }
        return Promise.all(promises);
    }
    static async createManyMediaPostsOfOrganization(user, orgId, amount) {
        const promises = [];
        for (let i = 0; i < amount; i += 1) {
            promises.push(this.createMediaPostOfOrganization(user, orgId));
        }
        return Promise.all(promises);
    }
    static async createMediaPostByUserHimself(user, values = {}) {
        const defaultValues = {
            title: 'Extremely new post',
            description: 'Our super post description',
            leading_text: 'extremely leading text',
            post_type_id: ContentTypeDictionary.getTypeMediaPost(),
            user_id: user.id,
            current_rate: 0,
            current_vote: 0,
            entity_images: '{}',
        };
        const newPostFields = _.defaults(values, defaultValues);
        const res = await request(server)
            .post(RequestHelper.getPostsUrl())
            .set('Authorization', `Bearer ${user.token}`)
            .field('title', newPostFields.title)
            .field('description', newPostFields.description)
            .field('leading_text', newPostFields.leading_text)
            .field('post_type_id', newPostFields.post_type_id)
            .field('user_id', newPostFields.user_id)
            .field('current_rate', newPostFields.current_rate)
            .field('current_vote', newPostFields.current_vote)
            .field('entity_images', newPostFields.entity_images);
        ResponseHelper.expectStatusOk(res);
        return +res.body.id;
    }
    static async createPostOfferByUserHimself(user) {
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
        const res = await request(server)
            .post(RequestHelper.getPostsUrl())
            .set('Authorization', `Bearer ${user.token}`)
            .field('title', newPostFields.title)
            .field('description', newPostFields.description)
            .field('leading_text', newPostFields.leading_text)
            .field('user_id', newPostFields.user_id)
            .field('post_type_id', newPostFields.post_type_id)
            .field('current_rate', newPostFields.current_rate)
            .field('current_vote', newPostFields.current_vote)
            .field('action_button_title', newPostFields.action_button_title)
            .field('entity_images', '{}');
        ResponseHelper.expectStatusOk(res);
        return +res.body.id;
    }
    /**
     * @param {Object} myself
     * @param {Object} wallOwner
     * @param {string|null} givenDescription
     * @param {boolean} withImage
     * @return {Promise<void>}
     *
     */
    static async createUserDirectPostForOtherUser(myself, wallOwner, givenDescription = null, withImage = false) {
        const url = RequestHelper.getUserDirectPostUrl(wallOwner);
        return this.createDirectPost(url, myself, givenDescription, withImage);
    }
    /**
     * @param {Object} myself
     * @param {Object} wallOwner
     * @param {string|null} givenDescription
     * @param {boolean} withImage
     * @return {Promise<void>}
     *
     */
    static async createUserDirectPostForOtherUserV2(myself, wallOwner, givenDescription = null, withImage = false) {
        const url = RequestHelper.getUserDirectPostUrlV2(wallOwner);
        return this.createDirectPost(url, myself, givenDescription, withImage);
    }
    static async createManyDirectPostsForUserAndGetIds(myself, wallOwner, amount) {
        const promises = [];
        for (let i = 0; i < amount; i += 1) {
            promises.push(this.createDirectPostForUserAndGetId(myself, wallOwner, null));
        }
        return Promise.all(promises);
    }
    static async createDirectPostForUserAndGetId(myself, wallOwner, givenDescription = null, withImage = false) {
        const url = RequestHelper.getUserDirectPostUrlV2(wallOwner);
        const body = await this.createDirectPost(url, myself, givenDescription, withImage);
        return body.id;
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
    static async createDirectPostForOrganization(myself, targetOrgId, givenDescription = null, withImage = false, idOnly = false) {
        const url = RequestHelper.getOrgDirectPostUrl(targetOrgId);
        return this.createDirectPost(url, myself, givenDescription, withImage, idOnly);
    }
    static async createDirectPostForOrganizationV2(myself, targetOrgId, givenDescription = null, withImage = false, idOnly = false) {
        const url = RequestHelper.getOrgDirectPostV2UrlV(targetOrgId);
        return this.createDirectPost(url, myself, givenDescription, withImage, idOnly);
    }
    static async createDirectPostForOrganizationV2AndGetId(myself, targetOrgId, givenDescription = null, withImage = false, idOnly = false) {
        const url = RequestHelper.getOrgDirectPostV2UrlV(targetOrgId);
        const data = await this.createDirectPost(url, myself, givenDescription, withImage, idOnly);
        return data.id;
    }
    static async createManyDirectPostsForOrganization(myself, orgId, amount) {
        const promises = [];
        for (let i = 0; i < amount; i += 1) {
            promises.push(this.createDirectPostForOrganization(myself, orgId, null, true, true));
        }
        return Promise.all(promises);
    }
    static async createDirectPostForUserWithFields(myself, wallOwner, givenFields) {
        const url = RequestHelper.getUserDirectPostUrlV2(wallOwner);
        const fields = Object.assign({ [EntityImagesModelProvider.entityImagesColumn()]: '{}' }, givenFields, { post_type_id: ContentTypeDictionary.getTypeDirectPost() });
        if (typeof fields[entityImagesField] === 'object') {
            fields[entityImagesField] = JSON.stringify(fields[entityImagesField]);
        }
        const req = request(server)
            .post(url);
        RequestHelper.addAuthToken(req, myself);
        RequestHelper.addFieldsToRequest(req, fields);
        const res = await req;
        ResponseHelper.expectStatusOk(res);
        return res.body;
    }
    static async createDirectPost(url, myself, givenDescription = null, 
    // @ts-ignore
    withImage = false, idOnly = false) {
        const postTypeId = ContentTypeDictionary.getTypeDirectPost();
        const description = givenDescription || 'sample direct post description';
        const req = request(server)
            .post(url);
        const fields = {
            description,
            post_type_id: postTypeId,
            entity_images: '{}',
        };
        RequestHelper.addAuthToken(req, myself);
        RequestHelper.addFieldsToRequest(req, fields);
        const res = await req;
        ResponseHelper.expectStatusOk(res);
        if (idOnly) {
            return res.body.id;
        }
        return res.body;
    }
}
module.exports = PostsGenerator;
