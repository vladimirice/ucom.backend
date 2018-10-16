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
  }}

module.exports = OrganizationsGenerator;