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
const request = require('supertest');
const server = require('../../app');
class CommentsGenerator {
    static createCommentForPost(postId, user, description = 'comment description') {
        return __awaiter(this, void 0, void 0, function* () {
            const req = request(server)
                .post(requestHelper.getCommentsUrl(postId))
                .field('description', description);
            requestHelper.addAuthToken(req, user);
            const res = yield req;
            responseHelper.expectStatusCreated(res);
            return res.body;
        });
    }
    /**
     *
     * @param {number} postId
     * @param {number} parentCommentId
     * @param {Object} user
     * @returns {Promise<Object>}
     */
    static createCommentOnComment(postId, parentCommentId, user) {
        return __awaiter(this, void 0, void 0, function* () {
            const req = request(server)
                .post(requestHelper.getCommentOnCommentUrl(postId, parentCommentId))
                .field('description', 'comment description');
            requestHelper.addAuthToken(req, user);
            const res = yield req;
            responseHelper.expectStatusCreated(res);
            return res.body;
        });
    }
}
module.exports = CommentsGenerator;
