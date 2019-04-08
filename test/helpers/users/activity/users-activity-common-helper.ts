import delay from 'delay';
import { UsersActivityModelDto } from '../../../../lib/users/interfaces/users-activity/model-interfaces';
import { AppError } from '../../../../lib/api/errors';

import UsersActivityRepository = require('../../../../lib/users/repository/users-activity-repository');

class UsersActivityCommonHelper {
  public static async getProcessedActivity(
    userId: number,
    eventId: number,
  ): Promise<UsersActivityModelDto> {
    let activity: UsersActivityModelDto | null = null;

    let counter = 0;
    while (!activity) {
      activity =
        await UsersActivityRepository.findLastByEventIdWithBlockchainIsSentStatus(userId, eventId);
      counter += 1;
      await delay(100);

      if (counter >= 100) {
        throw new AppError('Timeout is occurred - there is no processed activity in 10 seconds');
      }
    }

    return activity;
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
}

export = UsersActivityCommonHelper;
