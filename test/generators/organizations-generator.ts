import { UserModel } from '../../lib/users/interfaces/model-interfaces';

import RequestHelper = require('../integration/helpers/request-helper');
import ResponseHelper = require('../integration/helpers/response-helper');

const request = require('supertest');
const faker   = require('faker');

const server          = require('../../app');

class OrganizationsGenerator {
  /**
   *
   * @param {Object} author
   * @param {Object[]} teamMembers
   * @param {number} mul
   * @return {Promise<void>}
   */
  static async createManyOrgWithSameTeam(author, teamMembers, mul = 1) {
    for (let i = 0; i < mul; i += 1) {
      await this.createOrgWithTeam(author, teamMembers);
    }
  }

  public static async createManyOrgWithoutTeam(
    author: UserModel,
    amount: number,
  ): Promise<number[]> {
    const promises: Promise<any>[] = [];
    for (let i = 0; i < amount; i += 1) {
      promises.push(this.createOrgWithoutTeam(author));
    }

    return Promise.all(promises);
  }

  /**
   *
   * @param {Object} author
   * @return {Promise<Object>}
   */
  static async createOrgWithoutTeam(author: UserModel): Promise<number> {
    return this.createOrgWithTeam(author);
  }

  /**
   *
   * @param {Object} author
   * @param {Object[]} teamMembers
   * @return {Promise<Object>}
   */
  static async createOrgWithTeam(
    author: UserModel,
    teamMembers: UserModel[] = [],
  ): Promise<number> {
    // noinspection JSUnresolvedFunction
    const title = faker.company.companyName();
    // noinspection JSCheckFunctionSignatures
    const nickname = faker.name.firstName();

    const req = request(server)
      .post(RequestHelper.getOrganizationsUrl())
      .set('Authorization', `Bearer ${author.token}`)
      .field('title',             title)
      .field('nickname',          nickname)
    ;

    for (let i = 0; i < teamMembers.length; i += 1) {
      const field = `users_team[${i}][id]`;
      const user = teamMembers[i];
      req.field(field, user.id);
    }

    const res = await req;
    ResponseHelper.expectStatusCreated(res);

    return +res.body.id;
  }

  /**
   *
   * @param {number} orgId
   * @param {Object} user
   * @param {Object[]} usersTeam
   * @return {Promise<Object>}
   */
  static async updateOrgUsersTeam(orgId, user, usersTeam = []) {
    // noinspection JSUnresolvedFunction
    const title = faker.company.companyName();
    // noinspection JSCheckFunctionSignatures
    const nickname = faker.name.firstName();

    const req = request(server)
      .patch(RequestHelper.getOneOrganizationUrl(orgId))
      .set('Authorization', `Bearer ${user.token}`)
      .field('title', title)
      .field('nickname', nickname)
    ;

    this.addUsersTeamToRequest(req, usersTeam);

    const res = await req;
    ResponseHelper.expectStatusOk(res);

    return res.body;
  }

  static addUsersTeamToRequest(req, usersTeam) {
    for (let i = 0; i < usersTeam.length; i += 1) {
      const field = `users_team[${i}][id]`;
      const user = usersTeam[i];
      req.field(field, user.id);
    }
  }
}

export = OrganizationsGenerator;
