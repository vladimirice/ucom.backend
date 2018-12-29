const request = require('supertest');
const faker   = require('faker');

const requestHelper   = require('../integration/helpers').Req;
const responseHelper  = require('../integration/helpers').Res;
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

  /**
   *
   * @param {Object} author
   * @return {Promise<Object>}
   */
  static async createOrgWithoutTeam(author) {
    return await this.createOrgWithTeam(author);
  }

  /**
   *
   * @param {Object} author
   * @param {Object[]} teamMembers
   * @return {Promise<Object>}
   */
  static async createOrgWithTeam(author, teamMembers: any[] = []) {
    // noinspection JSUnresolvedFunction
    const title = faker.company.companyName();
    // noinspection JSCheckFunctionSignatures
    const nickname = faker.name.firstName();

    const req = request(server)
      .post(requestHelper.getOrganizationsUrl())
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
    responseHelper.expectStatusCreated(res);

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
      .patch(requestHelper.getOneOrganizationUrl(orgId))
      .set('Authorization', `Bearer ${user.token}`)
      .field('title', title)
      .field('nickname', nickname)
    ;

    this.addUsersTeamToRequest(req, usersTeam);

    const res = await req;
    responseHelper.expectStatusOk(res);

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
