"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const request = require('supertest');
const faker = require('faker');
const requestHelper = require('../integration/helpers').Req;
const responseHelper = require('../integration/helpers').Res;
const server = require('../../app');
class OrganizationsGenerator {
    /**
     *
     * @param {Object} author
     * @param {Object[]} teamMembers
     * @param {number} mul
     * @return {Promise<void>}
     */
    static createManyOrgWithSameTeam(author, teamMembers, mul = 1) {
        return __awaiter(this, void 0, void 0, function* () {
            for (let i = 0; i < mul; i += 1) {
                yield this.createOrgWithTeam(author, teamMembers);
            }
        });
    }
    /**
     *
     * @param {Object} author
     * @return {Promise<Object>}
     */
    static createOrgWithoutTeam(author) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.createOrgWithTeam(author);
        });
    }
    /**
     *
     * @param {Object} author
     * @param {Object[]} teamMembers
     * @return {Promise<Object>}
     */
    static createOrgWithTeam(author, teamMembers = []) {
        return __awaiter(this, void 0, void 0, function* () {
            // noinspection JSUnresolvedFunction
            const title = faker.company.companyName();
            // noinspection JSCheckFunctionSignatures
            const nickname = faker.name.firstName();
            const req = request(server)
                .post(requestHelper.getOrganizationsUrl())
                .set('Authorization', `Bearer ${author.token}`)
                .field('title', title)
                .field('nickname', nickname);
            for (let i = 0; i < teamMembers.length; i += 1) {
                const field = `users_team[${i}][id]`;
                const user = teamMembers[i];
                req.field(field, user.id);
            }
            const res = yield req;
            responseHelper.expectStatusCreated(res);
            return +res.body.id;
        });
    }
    /**
     *
     * @param {number} orgId
     * @param {Object} user
     * @param {Object[]} usersTeam
     * @return {Promise<Object>}
     */
    static updateOrgUsersTeam(orgId, user, usersTeam = []) {
        return __awaiter(this, void 0, void 0, function* () {
            // noinspection JSUnresolvedFunction
            const title = faker.company.companyName();
            // noinspection JSCheckFunctionSignatures
            const nickname = faker.name.firstName();
            const req = request(server)
                .patch(requestHelper.getOneOrganizationUrl(orgId))
                .set('Authorization', `Bearer ${user.token}`)
                .field('title', title)
                .field('nickname', nickname);
            this.addUsersTeamToRequest(req, usersTeam);
            const res = yield req;
            responseHelper.expectStatusOk(res);
            return res.body;
        });
    }
    static addUsersTeamToRequest(req, usersTeam) {
        for (let i = 0; i < usersTeam.length; i += 1) {
            const field = `users_team[${i}][id]`;
            const user = usersTeam[i];
            req.field(field, user.id);
        }
    }
}
module.exports = OrganizationsGenerator;
