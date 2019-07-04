import { SuperAgentRequest } from 'superagent';
import responseHelper from './response-helper';
import { UserModel } from '../../../lib/users/interfaces/model-interfaces';
import { StringToAnyCollection } from '../../../lib/common/interfaces/common-types';
import { IResponseBody } from '../../../lib/common/interfaces/request-interfaces';

import NumbersHelper = require('../../../lib/common/helper/numbers-helper');
import ResponseHelper = require('./response-helper');
import EntityImagesModelProvider = require('../../../lib/entity-images/service/entity-images-model-provider');

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
  public static getApiApplication() {
    return server;
  }

  public static async makePostRequest(
    url: string,
    fields: any,
    myself: UserModel | null = null,
  ): Promise<any> {
    const req = this.getRequestObjForPost(url);

    if (myself) {
      this.addAuthToken(req, myself);
    }

    this.addFieldsToRequest(req, fields);

    return req;
  }

  public static addEntityImagesField(req: any, entityImages: any): void {
    const value = typeof entityImages === 'string' ? entityImages : JSON.stringify(entityImages);

    req.field(EntityImagesModelProvider.entityImagesColumn(), value);
  }

  public static getUsersUrlV1(): string {
    return usersUrl;
  }

  public static getOneUserUrlV1(userId: number): string {
    return `${usersUrl}/${userId}`;
  }

  public static getAuthBearerHeader(token: string): { Authorization: string } {
    return {
      Authorization: `Bearer ${token}`,
    };
  }

  public static getGithubAuthHeader(token: string): any {
    return {
      [CommonHeaders.TOKEN_USERS_EXTERNAL_GITHUB]: token,
    };
  }

  public static addGithubAuthHeader(headers: any, token: string): void {
    headers[CommonHeaders.TOKEN_USERS_EXTERNAL_GITHUB] = token;
  }

  public static addAuthBearerHeader(headers: any, token: string): void {
    headers.Authorization = `Bearer ${token}`;
  }

  public static addAuthBearerHeaderOfMyself(headers: any, myself: UserModel): void {
    this.addAuthBearerHeader(headers, <string>myself.token);
  }

  public static addCookies(req: SuperAgentRequest, cookies: string[]): void {
    // @ts-ignore
    req.set('Cookie', cookies);
  }

  public static getRequestObj() {
    return request(server);
  }

  public static getRequestObjForPost(url: string): SuperAgentRequest {
    return request(server).post(url);
  }

  public static getRequestObjForGet(url: string): SuperAgentRequest {
    return request(server).get(url);
  }

  public static getRequestObjForPatch(url: string, myself: UserModel): SuperAgentRequest {
    const req =  request(server).patch(url);

    RequestHelper.addAuthToken(req, myself);

    return req;
  }

  public static getGetRequestAsMyself(url: string, myself: UserModel): IResponseBody {
    const req = this.getRequestObjForGet(url);

    this.addAuthToken(req, myself);

    return req;
  }

  public static getApiV1Prefix(): string {
    return apiV1Prefix;
  }

  public static generateRandomImportance(): number {
    return this.generateRandomNumber(1, 10, 6);
  }

  public static generateRandomBoolean(): boolean {
    return !!this.generateRandomNumber(0, 1, 0);
  }

  public static generateRandomNumber(min: number, max: number, precision: number): number {
    return NumbersHelper.generateRandomNumber(min, max, precision);
  }

  public static makeRandomString(length) {
    let text = '';
    // noinspection SpellCheckingInspection
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (let i = 0; i < length; i += 1) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    return text;
  }

  public static async makeRequestAndGetBody(req, expectedStatus = 200): Promise<any> {
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
  static async makeGetRequestForList(url, myself: UserModel | null = null, getOnlyData = true) {
    const req = request(server)
      .get(url);
    if (myself) {
      this.addAuthToken(req, myself);
    }

    const res = await req;

    responseHelper.expectValidListResponse(res);

    return getOnlyData ? res.body.data : res.body;
  }

  /**
   *
   * @param {string} url
   * @param {number} expectedStatus
   * @param {Object} myself
   * @returns {Promise<*>}
   */
  static async makeGetRequest(url, expectedStatus, myself: UserModel | null = null) {
    const req = request(server)
      .get(url);
    if (myself) {
      this.addAuthToken(req, myself);
    }

    const res = await req;
    responseHelper.expectStatusToBe(res, expectedStatus);

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

  public static addAuthToken(req: any, myself: UserModel): void {
    this.addAuthTokenString(req, myself.token);
  }

  public static addAuthTokenString(req: any, token: string): void {
    req
      .set('Authorization', `Bearer ${token}`);
  }

  public static addGithubAuthToken(req: any, token: string): void {
    req
      .set(CommonHeaders.TOKEN_USERS_EXTERNAL_GITHUB, token);
  }

  /**
   *
   * @param {string} url
   * @param {Object} fields
   * @return {Promise<Object>}
   */
  static async makePostGuestRequestWithFields(url: string, fields: StringToAnyCollection) {
    const req = request(server)
      .post(url);
    this.addFieldsToRequest(req, fields);

    return req;
  }

  public static addFormFieldsToRequestWithStringify(
    req: SuperAgentRequest,
    fields: StringToAnyCollection,
  ): void {
    const processed: StringToAnyCollection = {};
    for (const field in fields) {
      if (!fields.hasOwnProperty(field)) {
        continue;
      }

      processed[field] = typeof fields[field] === 'string' ? fields[field] : JSON.stringify(fields[field]);
    }

    this.addFieldsToRequest(req, processed);
  }

  public static addFieldsToRequest(
    req: SuperAgentRequest,
    fields: StringToAnyCollection,
  ): void {
    for (const field in fields) {
      if (!fields.hasOwnProperty(field)) {
        continue;
      }

      req.field(field, fields[field]);
    }
  }

  public static attachImage(req: any, field: string, imagePath: string): void {
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
    const params: string[] = [];

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

  public static getOrganizationsDiscussionUrl(orgId: number): string {
    return `${apiV1Prefix}/organizations/${orgId}/discussions`;
  }

  public static getValidateOneDiscussionUrl(orgId: number, postId: number): string {
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
    responseHelper.expectStatusOk(res);

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
    responseHelper.expectStatusOk(res);

    return res.body;
  }

  /**
   *
   * @deprecated
   * GraphQL is used
   * @param {Object} myself
   * @param {Object} userToRequest
   * @returns {Promise<Object>}
   */
  static async requestUserByIdAsMyself(myself, userToRequest) {
    const res = await request(server)
      .get(this.getUserUrl(userToRequest.id))
      .set('Authorization', `Bearer ${myself.token}`);
    responseHelper.expectStatusOk(res);

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

  static getUserDirectPostUrlV2(user: UserModel): string {
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

  public static getOrgDirectPostV2UrlV(orgId: number): string {
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

export = RequestHelper;
