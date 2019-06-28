import delay from 'delay';
import { UsersActivityModelDto } from '../../../../lib/users/interfaces/users-activity/model-interfaces';
import { AppError } from '../../../../lib/api/errors';
import { StringToAnyCollection } from '../../../../lib/common/interfaces/common-types';
import { UserModel } from '../../../../lib/users/interfaces/model-interfaces';

import UsersActivityRepository = require('../../../../lib/users/repository/users-activity-repository');
import UsersModelProvider = require('../../../../lib/users/users-model-provider');
import knex = require('../../../../config/knex');
import EosBlockchainStatusDictionary = require('../../../../lib/eos/eos-blockchain-status-dictionary');
import RepositoryHelper = require('../../../../lib/common/repository/repository-helper');

class UsersActivityCommonHelper {
  public static async setBlockchainStatusIsSuccessByUserFromUserTo(
    userFrom: UserModel,
    userTo: UserModel,
  ): Promise<number> {
    const data = await knex(UsersModelProvider.getUsersActivityTableName())
      .update({
        blockchain_status: EosBlockchainStatusDictionary.getStatusIsSent(),
      })
      .where({
        user_id_from: userFrom.id,
        entity_id_to: userTo.id,
        entity_name: UsersModelProvider.getEntityName(),
        blockchain_status: EosBlockchainStatusDictionary.getStatusNew(),
      })
      .returning(['id']);

    return RepositoryHelper.getKnexOneIdReturningOrException(data);
  }

  public static async getProcessedActivity(
    userIdFrom: number,
    eventId: number,
  ): Promise<{ activity: UsersActivityModelDto, blockchainResponse: StringToAnyCollection}> {
    let activity: UsersActivityModelDto | null = null;

    let counter = 0;
    while (!activity) {
      activity =
        await UsersActivityRepository.findLastByEventIdWithBlockchainIsSentStatus(userIdFrom, eventId);
      counter += 1;
      await delay(100);

      if (counter >= 100) {
        throw new AppError('Timeout is occurred - there is no processed activity in 10 seconds');
      }
    }

    return {
      activity,
      blockchainResponse: JSON.parse(activity.blockchain_response),
    };
  }

  public static getOneUserToOtherPushResponse(
    accountNameFrom: string,
    accountNameTo: string,
    isTrust: boolean,
  ): any {
    const interaction = isTrust ? 'trust' : 'untrust';

    return {
      producer_block_id: null,
      receipt: {
        status: 'executed',
      },
      scheduled: false,
      action_traces: [
        {
          receipt: {
            receiver: 'uos.activity',
          },
          act: {
            account: 'uos.activity',
            name: 'socialaction',
            authorization: [
              {
                actor: accountNameFrom,
                permission: 'active',
              },
            ],
            data: {
              acc: accountNameFrom,
              // eslint-disable-next-line no-useless-escape
              action_json: `{\"interaction\":\"${interaction}\",\"data\":{\"account_from\":\"${accountNameFrom}\",\"account_to\":\"${accountNameTo}\"}}`,
            },
          },
          context_free: false,
          console: '',
          producer_block_id: null,
          account_ram_deltas: [],
          except: null,
          inline_traces: [],
        },
      ],
      except: null,
    };
  }

  public static getOneUserSocialPushResponse(
    accountNameFrom: string,
    accountNameTo: string,
    interaction: string,
  ): any {
    return {
      producer_block_id: null,
      receipt:
        {
          status: 'executed',
        },
      scheduled: false,
      action_traces: [
        {
          receipt: {
            receiver: 'uos.activity',
          },
          act: {
            account: 'uos.activity',
            name: 'socialaction',
            authorization: [
              {
                actor: accountNameFrom,
                permission: 'active',
              },
            ],
            data: {
              acc: accountNameFrom,
              // eslint-disable-next-line no-useless-escape
              action_json: `{\"interaction\":\"${interaction}\",\"data\":{\"account_from\":\"${accountNameFrom}\",\"account_to\":\"${accountNameTo}\"}}`,
            },
          },
        },
      ],
    };
  }
}

export = UsersActivityCommonHelper;
