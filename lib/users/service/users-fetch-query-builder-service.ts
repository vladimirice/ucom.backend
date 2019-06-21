import { DbParamsDto } from '../../api/filters/interfaces/query-filter-interfaces';
import { BadRequestError } from '../../api/errors';
import { UsersActivityQueryDto } from '../interfaces/model-interfaces';

import UsersRepository = require('../users-repository');
import UsersActivityFollowRepository = require('../repository/users-activity/users-activity-follow-repository');
import UsersActivityTrustRepository = require('../repository/users-activity/users-activity-trust-repository');
import UsersActivityReferralRepository = require('../../affiliates/repository/users-activity-referral-repository');

class UsersFetchQueryBuilderService {
  public static getPromisesByActivityType(
    query: UsersActivityQueryDto,
    userId: number,
    params: DbParamsDto,
  ): Promise<any>[] {
    const type = query.activity;
    if (!type) {
      throw new BadRequestError('Please specify an activity_type filter');
    }

    let promises;
    switch (query.activity) {
      case 'followed_by':
        promises = [
          UsersRepository.findAllWhoFollowsUser(userId, params),
          UsersActivityFollowRepository.countUsersThatFollowUser(userId),
        ];
        break;
      case 'I_follow':
        promises = [
          UsersRepository.findUsersIFollow(userId, params),
          UsersActivityFollowRepository.countUsersIFollow(userId),
        ];
        break;
      case 'trusted_by':
        promises = [
          UsersRepository.findAllWhoTrustsUser(userId, params),
          UsersActivityTrustRepository.countUsersThatTrustUser(userId),
        ];
        break;
      case 'referrals':
        promises = [
          UsersRepository.findUserReferrals(userId, params),
          UsersActivityReferralRepository.countReferralsOfUser(userId),
        ];
        break;
      default:
        throw new BadRequestError(`Unsupported activity_type: ${type}`);
    }

    return promises;
  }
}

export = UsersFetchQueryBuilderService;
