const request = require('supertest');
const faker   = require('faker');

const RequestHelper   = require('../integration/helpers').Req;
const ResponseHelper  = require('../integration/helpers').Res;
const server          = require('../../app');

class OrganizationsGenerator {

  /**
   *
   * @param {Object} author
   * @param {Object[]} teamMembers
   * @return {Promise<Object>}
   */
  static async createOrgWithTeam(author, teamMembers = []) {
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

    for (let i = 0; i < teamMembers.length; i++) {
      const field = `users_team[${i}][id]`;
      const user = teamMembers[i];
      req.field(field, user.id);
    }

    const res = await req;
    ResponseHelper.expectStatusCreated(res);

    return res.body.id;
  }

  /**
   *
   * @param {number} org_id
   * @param {Object} user
   * @param {Object[]} usersTeam
   * @return {Promise<Object>}
   */
  static async updateOrgUsersTeam(org_id, user, usersTeam = []) {
    // noinspection JSUnresolvedFunction
    const title = faker.company.companyName();
    // noinspection JSCheckFunctionSignatures
    const nickname = faker.name.firstName();

    const req = request(server)
      .patch(RequestHelper.getOneOrganizationUrl(org_id))
      .set('Authorization', `Bearer ${user.token}`)
      .field('title', title)
      .field('nickname', nickname)
    ;

    this._addUsersTeamToRequest(req, usersTeam);

    const res = await req;
    ResponseHelper.expectStatusOk(res);

    return res.body;
  }

  static _addUsersTeamToRequest(req, usersTeam) {
    for (let i = 0; i < usersTeam.length; i++) {
      const field = `users_team[${i}][id]`;
      const user = usersTeam[i];
      req.field(field, user.id);
    }
  }

}

module.exports = OrganizationsGenerator;