import _ from 'lodash';
import { ContentTypesDictionary, EntityNames, EventsIdsDictionary } from 'ucom.libs.common';
import {
  UsersActivityModelDto,
  UsersActivityIndexModelDto,
} from '../../../../../lib/users/interfaces/users-activity/model-interfaces';
import { UserModel } from '../../../../../lib/users/interfaces/model-interfaces';
import { FAKE_BLOCKCHAIN_ID, FAKE_SIGNED_TRANSACTION } from '../../../../generators/common/fake-data-generator';

import SeedsHelper = require('../../../helpers/seeds-helper');
import UsersActivityRequestHelper = require('../../../../helpers/users/activity/users-activity-request-helper');
import UsersActivityRepository = require('../../../../../lib/users/repository/users-activity-repository');
import UsersActivityTrustRepository = require('../../../../../lib/users/repository/users-activity/users-activity-trust-repository');
import UsersModelProvider = require('../../../../../lib/users/users-model-provider');
import CommonChecker = require('../../../../helpers/common/common-checker');
import PostsModelProvider = require('../../../../../lib/posts/service/posts-model-provider');
import knex = require('../../../../../config/knex');
import UsersHelper = require('../../../helpers/users-helper');

require('jest-expect-message');

let userVlad: UserModel;
let userJane: UserModel;

const beforeAfterOptions = {
  isGraphQl: true,
  workersMocking: 'all',
};

const JEST_TIMEOUT = 1000;
// @ts-ignore
const JEST_TIMEOUT_DEBUG = JEST_TIMEOUT * 1000;

describe('Users activity trust creation', () => {
  beforeAll(async () => {
    await SeedsHelper.beforeAllSetting(beforeAfterOptions);
  });
  afterAll(async () => {
    await SeedsHelper.doAfterAll(beforeAfterOptions);
  });
  beforeEach(async () => {
    [userVlad, userJane] = await SeedsHelper.beforeAllRoutine();
  });

  describe('Trust workflow', () => {
    describe('Positive', () => {
      it('Vlad trusts Jane without autoUpdate (Legacy) - should create correct activity record', async () => {
        const signedTransaction = 'sample_one';
        await UsersActivityRequestHelper.trustOneUser(userVlad, userJane.id, signedTransaction);

        const dbActivity = await UsersActivityRepository.findLastTrustUserActivity(userVlad.id, userJane.id);
        expect(_.isEmpty(dbActivity)).toBeFalsy();

        const dbActivityExpected: UsersActivityModelDto = {
          activity_type_id: 30,
          activity_group_id: 3,

          blockchain_status: 0,
          blockchain_response: '',

          entity_id_on: null,
          // @ts-ignore
          entity_id_to: `${userJane.id}`,
          entity_name: UsersModelProvider.getEntityName(),
          entity_name_on: null,

          event_id: 36,
          user_id_from: userVlad.id,
          signed_transaction: signedTransaction,
        };

        expect(dbActivity).toMatchObject(dbActivityExpected);


        const trustIndexRowExpected = {
          user_id: userVlad.id,
          entity_id: `${userJane.id}`,
          entity_name: UsersModelProvider.getEntityName(),
        };

        const trustIndexRow: UsersActivityIndexModelDto | null =
            await UsersActivityTrustRepository.getUserTrustUser(userVlad.id, userJane.id);

        CommonChecker.expectNotEmpty(trustIndexRow);
        expect(trustIndexRow).toMatchObject(trustIndexRowExpected);
      });

      it('should create auto-update post if blockchain id is provided', async () => {
        const eventId = EventsIdsDictionary.getUserTrustsYou();
        await UsersActivityRequestHelper.trustOneUserWithFakeAutoUpdate(
          userVlad,
          userJane.id,
        );

        await checkPostAutoUpdate(eventId);
      });
    });
    describe('Negative', () => {
      it('Not possible to trust user which does not exist', async () => {
        await UsersActivityRequestHelper.trustOneUser(userVlad, 100500, 'sample_one', 404);
      });

      it('Not possible to trust for yourself', async () => {
        await UsersActivityRequestHelper.trustOneUser(userVlad, userVlad.id, 'sample_one', 400);
      });

      it('Not possible to trust twice', async () => {
        await UsersActivityRequestHelper.trustOneUser(userVlad, userJane.id, 'sample_one');
        await UsersActivityRequestHelper.trustOneUser(userVlad, userJane.id, 'sample_one', 400);
      });

      it('Not possible to trust without signed transaction', async () => {
        await UsersActivityRequestHelper.trustOneUser(userVlad, userJane.id, '', 400);
        await UsersActivityRequestHelper.trustOneUser(userVlad, userJane.id, null, 400);
      });
    });
  });

  describe('Untrust workflow', () => {
    describe('Positive', () => {
      it('Vlad untrusts Jane without autoUpdate - (legacy) should create correct activity record', async () => {
        const signedTransaction = 'sample_one';
        await UsersActivityRequestHelper.trustOneUser(userVlad, userJane.id, signedTransaction);
        await UsersActivityRequestHelper.untrustOneUser(userVlad, userJane.id, signedTransaction);

        const dbActivity = await UsersActivityRepository.findLastUntrustUserActivity(userVlad.id, userJane.id);
        expect(_.isEmpty(dbActivity)).toBeFalsy();

        const dbActivityExpected: UsersActivityModelDto = {
          activity_type_id: 31,
          activity_group_id: 3,

          blockchain_status: 0,
          blockchain_response: '',

          entity_id_on: null,
          // @ts-ignore
          entity_id_to: `${userJane.id}`,
          entity_name: UsersModelProvider.getEntityName(),
          entity_name_on: null,

          event_id: 37,
          user_id_from: userVlad.id,
          signed_transaction: signedTransaction,
        };

        expect(dbActivity).toMatchObject(dbActivityExpected);

        const trustIndexRow: UsersActivityIndexModelDto | null =
            await UsersActivityTrustRepository.getUserTrustUser(userVlad.id, userJane.id);

        expect(_.isEmpty(trustIndexRow)).toBeTruthy();
      });

      it('should create auto-update post if blockchain id is provided', async () => {
        await UsersActivityRequestHelper.trustOneUserWithFakeAutoUpdate(userVlad, userJane.id);

        const eventId = EventsIdsDictionary.getUserUntrustsYou();
        await UsersActivityRequestHelper.untrustOneUserWithAutoUpdate(
          userVlad,
          userJane.id,
          FAKE_BLOCKCHAIN_ID,
          FAKE_SIGNED_TRANSACTION,
        );

        await checkPostAutoUpdate(eventId);
      });
    });
    describe('Negative', () => {
      it('Not possible to untrust user which does not exist', async () => {
        await UsersActivityRequestHelper.untrustOneUser(userVlad, 100500, 'sample_one', 404);
      });

      it('Not possible to untrust twice', async () => {
        await UsersActivityRequestHelper.trustOneUser(userVlad, userJane.id, 'sample_one');

        await UsersActivityRequestHelper.untrustOneUser(userVlad, userJane.id, 'sample_one');
        await UsersActivityRequestHelper.untrustOneUser(userVlad, userJane.id, 'sample_one', 400);
      });

      it('Not possible to untrust without signed transaction', async () => {
        await UsersActivityRequestHelper.trustOneUser(userVlad, userJane.id, 'sample_one');

        await UsersActivityRequestHelper.untrustOneUser(userVlad, userJane.id, '', 400);
        await UsersActivityRequestHelper.untrustOneUser(userVlad, userJane.id, null, 400);
      });
    });
  });
});

async function checkPostAutoUpdate(eventId: number) {
  const post = await knex(PostsModelProvider.getTableName())
    .where({
      post_type_id:     ContentTypesDictionary.getTypeAutoUpdate(),
      user_id:          userVlad.id,
      entity_id_for:    userVlad.id,
      entity_name_for:  EntityNames.USERS,
      blockchain_id:    FAKE_BLOCKCHAIN_ID,
    })
    .orderBy('id', 'DESC')
    .first();

  CommonChecker.expectNotEmpty(post);

  const { meta_data: metaData, data, target_entity: targetEntity } = post.json_data;

  CommonChecker.expectNotEmpty(metaData);
  expect(metaData.eventId).toBe(eventId);

  UsersHelper.checkIncludedUserPreview(data);
  UsersHelper.checkIncludedUserPreview(targetEntity);
}

export {};
