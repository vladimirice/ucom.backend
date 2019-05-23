import { GraphqlHelper } from '../../integration/helpers/graphql-helper';
import AirdropsUsersGenerator = require('../../generators/airdrops/airdrops-users-generator');
import AirdropsUsersToPendingService = require('../../../lib/airdrops/service/status-changer/airdrops-users-to-pending-service');
import CommonHelper = require('../../integration/helpers/common-helper');
import { UserModel } from '../../../lib/users/interfaces/model-interfaces';

class AirdropsTestSet {
  public static async getManyParticipantsAsSeparateRequest(userVlad: UserModel, userJane: UserModel, airdropCreationResponse): Promise<void> {
    const { airdropId, orgId } = airdropCreationResponse;
    const manyUsersEmpty = await GraphqlHelper.getManyUsersAsParticipantsAsMyself(userVlad, airdropId);
    expect(manyUsersEmpty.data.length).toBe(0);

    await AirdropsUsersGenerator.fulfillAirdropCondition(airdropId, userVlad, orgId);
    await AirdropsUsersToPendingService.process(airdropId);

    const manyUsersVladOnly = await GraphqlHelper.getManyUsersAsParticipantsAsMyself(userVlad, airdropId);
    expect(manyUsersVladOnly.data.length).toBe(1);

    const options = {
      author: {
        myselfData: true,
      },
      airdrops: {},
    };

    CommonHelper.checkUsersListResponse(manyUsersVladOnly, options);

    expect(manyUsersVladOnly.data[0].external_login).toBe('vladimirice');
    expect(manyUsersVladOnly.data[0].score).toBeGreaterThan(0);

    expect(manyUsersVladOnly.metadata.total_amount).toBe(1);
    expect(manyUsersVladOnly.metadata.has_more).toBeFalsy();

    await AirdropsUsersGenerator.fulfillAirdropCondition(airdropId, userJane, orgId);
    await AirdropsUsersToPendingService.process(airdropId);

    const manyUsers = await GraphqlHelper.getManyUsersAsParticipantsAsMyself(userVlad, airdropId);
    expect(manyUsers.data.length).toBe(2);

    const vladResponse = manyUsers.data.find(item => item.account_name === userVlad.account_name);
    const janeResponse = manyUsers.data.find(item => item.account_name === userJane.account_name);

    expect(vladResponse.external_login).toBe('vladimirice');
    expect(vladResponse.score).toBeGreaterThan(0);

    expect(janeResponse.external_login).toBe('akegaviar');
    expect(janeResponse.score).toBeGreaterThan(0);

    expect(manyUsers.metadata.total_amount).toBe(2);
    expect(manyUsers.metadata.has_more).toBeFalsy();
  }}

export = AirdropsTestSet;

