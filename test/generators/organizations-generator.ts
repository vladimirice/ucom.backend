import { UserModel } from '../../lib/users/interfaces/model-interfaces';
import { StringToAnyCollection } from '../../lib/common/interfaces/common-types';
import { OrgModel } from '../../lib/organizations/interfaces/model-interfaces';
import { FAKE_SIGNED_TRANSACTION } from './common/fake-data-generator';

import RequestHelper = require('../integration/helpers/request-helper');
import ResponseHelper = require('../integration/helpers/response-helper');
import UsersHelper = require('../integration/helpers/users-helper');

import EntityImagesGenerator = require('./common/entity-images-generator');
import OrganizationsRepository = require('../../lib/organizations/repository/organizations-repository');
import BlockchainUniqId = require('../../lib/eos/eos-blockchain-uniqid');

const request = require('supertest');
const faker   = require('faker');

const server          = RequestHelper.getApiApplication();

class OrganizationsGenerator {
  public static async changeDiscussionsState(
    myself: UserModel,
    orgId: number,
    postsIds: number[],
    expectedStatus: number = 200,
  ): Promise<void> {
    const url = RequestHelper.getOrganizationsDiscussionUrl(orgId);

    const req = request(server)
      .post(url)
    ;

    // eslint-disable-next-line unicorn/no-for-loop
    for (let i = 0; i < postsIds.length; i += 1) {
      const field = `discussions[${i}][id]`;
      req.field(field, postsIds[i]);
    }

    RequestHelper.addAuthToken(req, myself);

    const res = await req;

    ResponseHelper.expectStatusToBe(res, expectedStatus);

    return res;
  }

  public static async deleteAllDiscussions(
    myself: UserModel,
    orgId: number,
  ): Promise<void> {
    const url = RequestHelper.getOrganizationsDiscussionUrl(orgId);

    const req = request(server)
      .delete(url)
    ;

    RequestHelper.addAuthToken(req, myself);

    const res = await req;

    ResponseHelper.expectStatusToBe(res, 204);
  }

  /**
   *
   * @param {Object} author
   * @param {Object[]} teamMembers
   * @param {number} mul
   * @return {Promise<void>}
   */
  public static async createManyOrgWithSameTeam(author, teamMembers, mul = 1) {
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

  public static async createOrgWithoutTeam(author: UserModel, extraFields: any = {}): Promise<number> {
    return this.createOrgWithTeam(author, [], extraFields);
  }

  public static async createOrgWithoutTeamAndGetModel(myself: UserModel, extraFields: any = {}): Promise<OrgModel> {
    const orgId: number = await this.createOrgWithTeam(myself, [], extraFields);

    return OrganizationsRepository.findOnlyItselfById(orgId);
  }

  public static async createOrgWithTeamAndConfirmAll(
    author: UserModel,
    teamMembers: UserModel[] = [],
  ): Promise<number> {
    const orgId: number = await this.createOrgWithTeam(author, teamMembers);

    for (const user of teamMembers) {
      await UsersHelper.directlySetUserConfirmsInvitation(orgId, user);
    }

    return orgId;
  }

  public static createOrganizationWithEntityImages(author: UserModel): Promise<number> {
    const extraFields: StringToAnyCollection = EntityImagesGenerator.getObjectWithEntityImages();

    return this.createOrgWithTeam(author, [], extraFields);
  }

  public static async createOrgWithTeam(
    author: UserModel,
    teamMembers: UserModel[] = [],
    extraFields: StringToAnyCollection = {},
  ): Promise<number> {
    const req = request(server)
      .post(RequestHelper.getOrganizationsUrl())
      .set('Authorization', `Bearer ${author.token}`)
    ;

    const defaultFields: any = {
      title:              faker.company.companyName(),
      about:              faker.company.companyName(),
      powered_by:         faker.company.companyName(),
      nickname:           `${faker.name.firstName()}_${RequestHelper.generateRandomNumber(0, 10, 0)}`,
      email:              faker.internet.email(),
      blockchain_id:      BlockchainUniqId.getUniqidByScope('organizations'),
    };

    if (!extraFields.is_multi_signature) {
      defaultFields.signed_transaction = FAKE_SIGNED_TRANSACTION;
    }

    const fields = {
      ...defaultFields,
      ...extraFields,
    };

    // eslint-disable-next-line unicorn/no-for-loop
    for (let i = 0; i < teamMembers.length; i += 1) {
      const field = `users_team[${i}][id]`;
      const user = teamMembers[i];
      req.field(field, user.id);
    }

    RequestHelper.addFormFieldsToRequestWithStringify(req, fields);

    const res = await req;
    ResponseHelper.expectStatusCreated(res);

    return +res.body.id;
  }

  public static async updateOrganization(
    organizationId: number,
    myself: UserModel,
    usersTeam: any[] = [],
    givenFields: any = {},
  ) {
    const url: string = RequestHelper.getOneOrganizationUrl(organizationId);

    const defaultFields = {
      title:    faker.company.companyName(),
      nickname: faker.name.firstName(),
      signed_transaction: 'signed_transaction',
    };

    const fields = {
      ...defaultFields,
      ...givenFields,
    };

    const req = RequestHelper.getRequestObjForPatchWithFields(url, myself, fields);
    this.addUsersTeamToRequest(req, usersTeam);

    const response = await req;
    ResponseHelper.expectStatusOk(response);

    return response.body;
  }

  static addUsersTeamToRequest(req, usersTeam) {
    // eslint-disable-next-line unicorn/no-for-loop
    for (let i = 0; i < usersTeam.length; i += 1) {
      const field = `users_team[${i}][id]`;
      const user = usersTeam[i];
      req.field(field, user.id);
    }
  }
}

export = OrganizationsGenerator;
