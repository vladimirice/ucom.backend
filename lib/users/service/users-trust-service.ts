import { Transaction } from 'knex';
import { EventsIdsDictionary, InteractionTypesDictionary } from 'ucom.libs.common';
import { UserModel } from '../interfaces/model-interfaces';
import { AppError, BadRequestError } from '../../api/errors';
import { IRequestBody } from '../../common/interfaces/common-types';
import { IActivityModel } from '../interfaces/users-activity/dto-interfaces';

import UsersRepository = require('../users-repository');
import ActivityGroupDictionary = require('../../activity/activity-group-dictionary');
import UsersModelProvider = require('../users-model-provider');
import UsersActivityRepository = require('../repository/users-activity-repository');
import knex = require('../../../config/knex');
import UsersActivityTrustRepository = require('../repository/users-activity/users-activity-trust-repository');
import SignedTransactionValidator = require('../../eos/validator/signed-transaction-validator');
import ActivityProducer = require('../../jobs/activity-producer');
import UserActivitySerializer = require('../job/user-activity-serializer');
import AutoUpdateCreatorService = require('../../posts/service/auto-update-creator-service');

class UsersTrustService {
  public static async trustUser(userFrom: UserModel, userIdTo: number, body: any): Promise<void> {
    const activityTypeId: number  = InteractionTypesDictionary.getTrustId();
    const eventId: number         = EventsIdsDictionary.getUserTrustsYou();

    await this.trustOrUntrustUser(userFrom, userIdTo, body, activityTypeId, eventId);
  }

  public static async untrustUser(userFrom: UserModel, userIdTo: number, body: any): Promise<void> {
    const activityTypeId: number  = InteractionTypesDictionary.getUntrustId();
    const eventId: number         = EventsIdsDictionary.getUserUntrustsYou();

    await this.trustOrUntrustUser(userFrom, userIdTo, body, activityTypeId, eventId);
  }

  private static async trustOrUntrustUser(
    userFrom: UserModel,
    userIdTo: number,
    body: any,
    activityTypeId: number,
    eventId: number,
  ): Promise<void> {
    await this.checkPreconditions(userFrom, userIdTo, activityTypeId, body);

    const activity: IActivityModel =
      await this.processAndGetNewActivity(userFrom, userIdTo, eventId, activityTypeId, body);

    const job: string =
      UserActivitySerializer.createJobWithOnlyEosJsV2Option(activity.id);

    await ActivityProducer.publishWithUserActivity(job);
  }

  private static async processAndGetNewActivity(
    userFrom: UserModel,
    userIdTo: number,
    eventId: number,
    activityTypeId: number,
    body: IRequestBody,
  ): Promise<IActivityModel> {
    return knex.transaction(async (transaction: Transaction) => {
      const promises: any = [
        await this.createTrustOrUntrustUserActivity(
          activityTypeId,
          eventId,
          body.signed_transaction,
          userFrom.id,
          userIdTo,
          transaction,
        ),
        this.processTrustIndex(userFrom.id, userIdTo, eventId, transaction),
      ];

      if (body.blockchain_id) {
        promises.push(
          AutoUpdateCreatorService.createUserToUser(transaction, userFrom, userIdTo, body.blockchain_id, eventId),
        );
      }

      const [newActivity] = await Promise.all(promises);

      return newActivity;
    });
  }

  private static async processTrustIndex(
    userIdFrom: number,
    userIdTo: number,
    eventId: number,
    transaction: Transaction,
  ): Promise<void> {
    if (EventsIdsDictionary.isUserTrustsYou(eventId)) {
      await UsersActivityTrustRepository.insertOneTrustUser(userIdFrom, userIdTo, transaction);
    } else if (EventsIdsDictionary.isUserUntrustsYou(eventId)) {
      const deleteRes = await UsersActivityTrustRepository.deleteOneTrustUser(userIdFrom, userIdTo, transaction);
      if (deleteRes === null) {
        throw new AppError(`No record to delete. It is possible that it is concurrency. User ID from: ${userIdFrom}, user ID to ${userIdTo}`);
      }
    } else {
      throw new AppError(`Unsupported eventId: ${eventId}`);
    }
  }

  private static async checkPreconditions(
    userFrom: UserModel,
    userIdTo: number,
    activityTypeId: number,
    body: any,
  ): Promise<void> {
    if (userFrom.id === userIdTo) {
      throw new BadRequestError({
        general: 'It is not possible to trust or untrust yourself',
      }, 400);
    }

    SignedTransactionValidator.validateBodyWithBadRequestError(body);

    const [userToAccountName, isTrust] = await Promise.all([
      UsersRepository.findAccountNameById(userIdTo),
      UsersActivityTrustRepository.getUserTrustUser(userFrom.id, userIdTo),
    ]);

    if (!userToAccountName) {
      throw new BadRequestError(`There is no user with ID: ${userIdTo}`, 404);
    }

    if (isTrust !== null && activityTypeId !== InteractionTypesDictionary.getUntrustId()) {
      throw new BadRequestError(
        `User with ID ${userFrom.id} already trusts user with ID ${userIdTo}. Only untrust activity is allowed`,
      );
    }

    if (isTrust === null && activityTypeId !== InteractionTypesDictionary.getTrustId()) {
      throw new BadRequestError(
        `User with ID ${userFrom.id} does not trust user with ID ${userIdTo}. Only trust activity is allowed`,
      );
    }
  }

  private static async createTrustOrUntrustUserActivity(
    activityTypeId: number,
    eventId: number,
    signedTransaction: string,
    currentUserId: number,
    userIdTo: number,
    trx: Transaction,
  ) {
    const activityGroupId = ActivityGroupDictionary.getGroupUserUserInteraction();
    const entityName      = UsersModelProvider.getEntityName();

    const data = {
      activity_type_id:   activityTypeId,
      activity_group_id:  activityGroupId,
      user_id_from:       currentUserId,
      entity_id_to:       userIdTo,
      entity_name:        entityName,
      signed_transaction: signedTransaction,

      event_id:           eventId,
    };

    return UsersActivityRepository.createNewKnexActivity(data, trx);
  }
}

export = UsersTrustService;
