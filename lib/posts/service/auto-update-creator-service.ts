import { Transaction } from 'knex';

import { EntityNames } from 'ucom.libs.common';
import { UserModel, UserModelPreview } from '../../users/interfaces/model-interfaces';
import { StringToAnyCollection } from '../../common/interfaces/common-types';

import PostsRepository = require('../posts-repository');
import UsersRepository = require('../../users/users-repository');
import UserPostProcessor = require('../../users/user-post-processor');
import PostsCurrentParamsRepository = require('../repository/posts-current-params-repository');
import PostStatsRepository = require('../stats/post-stats-repository');

class AutoUpdateCreatorService {
  public static async createUserToUser(
    transaction: Transaction,
    userFrom: UserModel,
    userIdTo: number,
    blockchainId: string,
    eventId: number,
  ) {
    const userFromPreview = UserPostProcessor.processOnlyUserForPreview(userFrom);
    const userToPreview = await UsersRepository.findOneByIdForPreview(userIdTo);
    UserPostProcessor.processOnlyUserItself(<UserModel>userToPreview);

    const jsonData = this.getUserToUserJsonData(
      userFromPreview,
      <UserModelPreview>userToPreview,
      eventId,
    );

    const newPostId = await PostsRepository.createAutoUpdate(
      transaction, userFrom.id, userFrom.id, EntityNames.USERS, blockchainId, jsonData,
    );

    await Promise.all([
      PostStatsRepository.createNewByKnex(newPostId, transaction),
      PostsCurrentParamsRepository.insertRowForNewEntityWithTransaction(newPostId, transaction),
    ]);
  }

  private static getUserToUserJsonData(userFrom: UserModelPreview, userTo: UserModelPreview, eventId: number) {
    const data = {
      User: userFrom,
    };
    const targetEntity = {
      User: userTo,
    };

    return this.getJsonData(data, targetEntity, eventId);
  }

  private static getJsonData(
    data: StringToAnyCollection,
    target_entity: StringToAnyCollection,
    eventId: number,
  ) {
    return {
      data,
      target_entity,
      meta_data: {
        eventId,
      },
    };
  }
}

export =AutoUpdateCreatorService;
