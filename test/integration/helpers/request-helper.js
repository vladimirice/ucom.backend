"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const response_helper_1 = __importDefault(require("./response-helper"));
const NumbersHelper = require("../../../lib/common/helper/numbers-helper");
const ResponseHelper = require("./response-helper");
const EntityImagesModelProvider = require("../../../lib/entity-images/service/entity-images-model-provider");
const { CommonHeaders } = require('ucom.libs.common').Common.Dictionary;
const request = require('supertest');
const server = require('../../../lib/api/applications/api-application');
const apiV1Prefix = '/api/v1';
const apiV2Prefix = '/api/v2';
const checkAccountRoute = '/api/v1/auth/registration/validate-account-name';
const registrationRoute = '/api/v1/auth/registration';
const postsUrl = `${apiV1Prefix}/posts`;
const postsV2Url = `${apiV2Prefix}/posts`;
const usersUrl = `${apiV1Prefix}/users`;
const usersUrlV2 = `${apiV2Prefix}/users`;
const organizationsUrl = `${apiV1Prefix}/organizations`;
const organizationsV2Url = `${apiV2Prefix}/organizations`;
const myselfUrl = `${apiV1Prefix}/myself`;
const communityUrl = `${apiV1Prefix}/community`;
const partnershipUrl = `${apiV1Prefix}/partnership`;
const blockchainUrl = `${apiV1Prefix}/blockchain`;
const tagsUrl = `${apiV1Prefix}/tags`;
const myselfBlockchainTransactionsUrl = `${myselfUrl}/blockchain/transactions`;
class RequestHelper {
    static getApiApplication() {
        return server;
    }
    static async makePostRequest(url, fields, myself = null) {
        const req = this.getRequestObjForPost(url);
        if (myself) {
            this.addAuthToken(req, myself);
        }
        this.addFieldsToRequest(req, fields);
        return req;
    }
    static addEntityImagesField(req, entityImages) {
        const value = typeof entityImages === 'string' ? entityImages : JSON.stringify(entityImages);
        req.field(EntityImagesModelProvider.entityImagesColumn(), value);
    }
    static getUsersUrlV1() {
        return usersUrl;
    }
    static getOneUserUrlV1(userId) {
        return `${usersUrl}/${userId}`;
    }
    static getAuthBearerHeader(token) {
        return {
            Authorization: `Bearer ${token}`,
        };
    }
    static getGithubAuthHeader(token) {
        return {
            [CommonHeaders.TOKEN_USERS_EXTERNAL_GITHUB]: token,
        };
    }
    static addGithubAuthHeader(headers, token) {
        headers[CommonHeaders.TOKEN_USERS_EXTERNAL_GITHUB] = token;
    }
    static addAuthBearerHeader(headers, token) {
        headers.Authorization = `Bearer ${token}`;
    }
    static getRequestObj() {
        return request(server);
    }
    static getRequestObjForPost(url) {
        return request(server).post(url);
    }
    static getApiV1Prefix() {
        return apiV1Prefix;
    }
    static generateRandomImportance() {
        return this.generateRandomNumber(1, 10, 6);
    }
    static generateRandomBoolean() {
        return !!this.generateRandomNumber(0, 1, 0);
    }
    static generateRandomNumber(min, max, precision) {
        return NumbersHelper.generateRandomNumber(min, max, precision);
    }
    static makeRandomString(length) {
        let text = '';
        // noinspection SpellCheckingInspection
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < length; i += 1) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }
    static async makeRequestAndGetBody(req, expectedStatus = 200) {
        const res = await req;
        ResponseHelper.expectStatusToBe(res, expectedStatus);
        return res.body;
    }
    /**
     *
     * @returns {string}
     */
    static getTagsRootUrl() {
        return tagsUrl;
    }
    /**
     *
     * @param {string} tagTitle
     */
    static getTagsWallFeedUrl(tagTitle) {
        return `${RequestHelper.getTagsRootUrl()}/${tagTitle}/wall-feed`;
    }
    /**
     *
     * @param {string} tagTitle
     */
    static getTagsOrgUrl(tagTitle) {
        return `${RequestHelper.getTagsRootUrl()}/${tagTitle}/organizations`;
    }
    /**
     *
     * @param {string} tagTitle
     */
    static getTagsUsersUrl(tagTitle) {
        return `${RequestHelper.getTagsRootUrl()}/${tagTitle}/users`;
    }
    /**
     *
     * @param {string} tagTitle
     * @returns {string}
     */
    static getOneTagUrl(tagTitle) {
        return `${RequestHelper.getTagsRootUrl()}/${tagTitle}`;
    }
    /**
     *
     * @param {string} url
     * @param {Object} myself
     * @param {boolean} getOnlyData
     * @returns {Promise<*>}
     */
    static async makeGetRequestForList(url, myself = null, getOnlyData = true) {
        const req = request(server)
            .get(url);
        if (myself) {
            this.addAuthToken(req, myself);
        }
        const res = await req;
        response_helper_1.default.expectValidListResponse(res);
        return getOnlyData ? res.body.data : res.body;
    }
    /**
     *
     * @param {string} url
     * @param {number} expectedStatus
     * @param {Object} myself
     * @returns {Promise<*>}
     */
    static async makeGetRequest(url, expectedStatus, myself = null) {
        const req = request(server)
            .get(url);
        if (myself) {
            this.addAuthToken(req, myself);
        }
        const res = await req;
        response_helper_1.default.expectStatusToBe(res, expectedStatus);
        return res;
    }
    /**
     *
     * @return {string}
     */
    static getMyselfBlockchainTransactionsUrl() {
        return myselfBlockchainTransactionsUrl;
    }
    /**
     *
     * @return {string}
     */
    static getBlockchainNodesListUrl() {
        return `${blockchainUrl}/nodes`;
    }
    /**
     *
     * @param {number} postId
     * @return {string}
     */
    static getCreateRepostUrl(postId) {
        const onePostUrl = this.getOnePostUrl(postId);
        return `${onePostUrl}/repost`;
    }
    static addAuthToken(req, myself) {
        req
            .set('Authorization', `Bearer ${myself.token}`);
    }
    static addGithubAuthToken(req, token) {
        req
            .set(CommonHeaders.TOKEN_USERS_EXTERNAL_GITHUB, token);
    }
    /**
     *
     * @param {string} url
     * @param {Object} fields
     * @return {Promise<Object>}
     */
    static async makePostGuestRequestWithFields(url, fields) {
        const req = request(server)
            .post(url);
        this.addFieldsToRequest(req, fields);
        return req;
    }
    /**
     *
     * @param {Object} req
     * @param {Object} fields
     */
    static addFieldsToRequest(req, fields) {
        // eslint-disable-next-line guard-for-in
        for (const field in fields) {
            req.field(field, fields[field]);
        }
    }
    static attachImage(req, field, imagePath) {
        req
            .attach(field, imagePath);
    }
    /**
     *
     * @return {string}
     */
    static getMyselfUrl() {
        return myselfUrl;
    }
    /**
     *
     * @param {number} id
     * @return {string}
     */
    static getConfirmNotificationUrl(id) {
        return `${this.getMyselfNotificationsList()}/${id}/confirm`;
    }
    /**
     *
     * @param {number} id
     * @return {string}
     */
    static getMarkAsSeenNotificationUrl(id) {
        return `${this.getMyselfNotificationsList()}/${id}/seen`;
    }
    /**
     *
     * @param {number} id
     * @return {string}
     */
    static getDeclineNotificationUrl(id) {
        return `${this.getMyselfNotificationsList()}/${id}/decline`;
    }
    /**
     *
     * @param {number} id
     * @return {string}
     */
    static getPendingNotificationUrl(id) {
        return `${this.getMyselfNotificationsList()}/${id}/pending`;
    }
    /**
     *
     * @param {number} targetUserId
     * @return {string}
     */
    static getOneUserWallFeed(targetUserId) {
        return `${usersUrl}/${targetUserId}/wall-feed`;
    }
    /**
     *
     * @return {string}
     */
    static getMyselfNotificationsList() {
        return `${myselfUrl}/notifications`;
    }
    /**
     *
     * @return {string}
     */
    static getMyselfNewsFeedUrl() {
        return `${myselfUrl}/news-feed`;
    }
    /**
     *
     * @param {number} targetOrgId
     * @return {string}
     */
    static getOneOrgWallFeed(targetOrgId) {
        return `${organizationsUrl}/${targetOrgId}/wall-feed/`;
    }
    /**
     *
     * @param {number} totalAmount
     * @param {number} perPage
     * @return {number}
     */
    static getLastPage(totalAmount, perPage) {
        return +Math.floor(totalAmount / perPage);
    }
    /**
     *
     * @param {number} page
     * @param {number} perPage
     * @returns {Promise<Object>}
     */
    static getPaginationQueryString(page, perPage) {
        const params = [];
        if (page) {
            params.push(`page=${page}`);
        }
        if (perPage) {
            params.push(`per_page=${perPage}`);
        }
        return `?${params.join('&')}`;
    }
    /**
     *
     * @param {string} query
     * @returns {string}
     */
    static getCommunitySearchUrl(query) {
        return `${communityUrl}/search?q=${query}`;
    }
    /**
     *
     * @param {number} orgId
     * @return {string}
     */
    static getOrgFollowUrl(orgId) {
        return `${this.getOrganizationsUrl()}/${orgId}/follow`;
    }
    /**
     *
     * @param {number} orgId
     * @return {string}
     */
    static getOrgUnfollowUrl(orgId) {
        return `${this.getOrganizationsUrl()}/${orgId}/unfollow`;
    }
    /**
     *
     * @param {string} query
     * @returns {string}
     */
    static getPartnershipSearchUrl(query) {
        return `${partnershipUrl}/search?q=${query}`;
    }
    /**
     *
     * @param {number} userId
     * @return {string}
     */
    static getUserPostsUrl(userId) {
        return `/api/v1/users/${userId}/posts`;
    }
    /**
     *
     * @return {string}
     */
    static getBlockchainContentUniqidUrl() {
        return `${blockchainUrl}/content/uniqid`;
    }
    /**
     *
     * @return {string}
     */
    static getOrganizationsUrl() {
        return `${apiV1Prefix}/organizations`;
    }
    static getOrganizationsDiscussionUrl(orgId) {
        return `${apiV1Prefix}/organizations/${orgId}/discussions`;
    }
    static getValidateOneDiscussionUrl(orgId, postId) {
        return `${apiV1Prefix}/organizations/${orgId}/discussions/${postId}/validate`;
    }
    /**
     *
     * @param {number} id
     * @return {string}
     */
    static getOneOrganizationUrl(id) {
        return `${this.getOrganizationsUrl()}/${id}`;
    }
    // noinspection JSUnusedGlobalSymbols
    /**
     *
     * @param {Object} user
     * @returns {Promise<Object>}
     */
    static async requestMyself(user) {
        const res = await request(server)
            .get(myselfUrl)
            .set('Authorization', `Bearer ${user.token}`);
        response_helper_1.default.expectStatusOk(res);
        return res.body;
    }
    /**
     *
     * @param {Object} user
     * @returns {Promise<Object>}
     */
    static async requestUserByIdAsGuest(user) {
        const res = await request(server)
            .get(this.getUserUrl(user.id));
        response_helper_1.default.expectStatusOk(res);
        return res.body;
    }
    /**
     *
     * @param {Object} myself
     * @param {Object} userToRequest
     * @returns {Promise<Object>}
     */
    static async requestUserByIdAsMyself(myself, userToRequest) {
        const res = await request(server)
            .get(this.getUserUrl(userToRequest.id))
            .set('Authorization', `Bearer ${myself.token}`);
        response_helper_1.default.expectStatusOk(res);
        return res.body;
    }
    static getUserUrl(userId) {
        return `/api/v1/users/${userId}`;
    }
    static getFollowUrl(userId) {
        return `/api/v1/users/${userId}/follow`;
    }
    static getUnfollowUrl(userId) {
        return `/api/v1/users/${userId}/unfollow`;
    }
    static getJoinUrl(postId) {
        return `/api/v1/posts/${postId}/join`;
    }
    static getCheckAccountNameRoute() {
        return checkAccountRoute;
    }
    static getRegistrationRoute() {
        return registrationRoute;
    }
    static getPostsUrl() {
        return postsUrl;
    }
    /**
     *
     * @param {Object} user
     * @return {string}
     */
    static getUserDirectPostUrl(user) {
        return `${usersUrl}/${user.id}/posts`;
    }
    static getUserDirectPostUrlV2(user) {
        return `${usersUrlV2}/${user.id}/posts`;
    }
    /**
     *
     * @param {number} orgId
     * @return {string}
     */
    static getOrgDirectPostUrl(orgId) {
        return `${organizationsUrl}/${orgId}/posts`;
    }
    static getOrgDirectPostV2UrlV(orgId) {
        return `${organizationsV2Url}/${orgId}/posts`;
    }
    static getUsersUrl() {
        return usersUrl;
    }
    /**
     *
     * @param {string} query
     * @returns {string}
     */
    static getUserSearchUrl(query) {
        return `${usersUrl}/search?q=${query}`;
    }
    static getOnePostUrl(postId) {
        return `${postsUrl}/${postId}`;
    }
    static getOnePostV2Url(postId) {
        return `${postsV2Url}/${postId}`;
    }
    /**
     *
     * @param {number} postId
     * @returns {string}
     */
    static getCommentsUrl(postId) {
        return `/api/v1/posts/${postId}/comments`;
    }
    /**
     *
     * @param {number} postId
     * @param {number} commentId
     * @returns {string}
     */
    static getCommentOnCommentUrl(postId, commentId) {
        return `/api/v1/posts/${postId}/comments/${commentId}/comments`;
    }
}
module.exports = RequestHelper;
