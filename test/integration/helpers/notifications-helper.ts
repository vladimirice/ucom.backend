/* tslint:disable:max-line-length */
import { AppError } from '../../../lib/api/errors';
import { UserModel } from '../../../lib/users/interfaces/model-interfaces';

const request = require('supertest');
const server = require('../../../app');
const requestHelper = require('./request-helper');
const responseHelper = require('./response-helper');

const _ = require('lodash');

const delay = require('delay');

const entityModelProvider = require('../../../lib/entities/service').ModelProvider;
const usersModelProvider = require('../../../lib/users/service').ModelProvider;

const notificationsStatusDictionary =
  require('../../../lib/entities/dictionary').NotificationsStatus;

const notificationsRepo =
  require('../../../lib/entities/repository').Notifications;

class NotificationsHelper {

  /**
   *
   * @param {Object} myself
   * @param {number} id
   * @param {number} expectedStatus
   * @return {Promise<Object>}
   *
   * @link EntityNotificationsService#confirmPromptNotification
   */
  static async requestToConfirmPrompt(myself, id, expectedStatus = 200) {
    const url = requestHelper.getConfirmNotificationUrl(id);

    const res = await request(server)
      .post(url)
      .set('Authorization', `Bearer ${myself.token}`)
    ;

    responseHelper.expectStatusToBe(res, expectedStatus);

    return res.body;
  }

  /**
   *
   * @param {Object} myself
   * @param {number} id
   * @param {number} expectedStatus
   * @return {Promise<Object>}
   *
   * @link EntityNotificationsService#markNotificationAsSeen
   */
  static async requestToMarkNotificationSeen(myself, id, expectedStatus = 200) {
    const url = requestHelper.getMarkAsSeenNotificationUrl(id);

    const res = await request(server)
      .post(url)
      .set('Authorization', `Bearer ${myself.token}`)
    ;

    responseHelper.expectStatusToBe(res, expectedStatus);

    return res.body;
  }

  /**
   *
   * @param {Object} myself
   * @param {number} id
   * @param {number} expectedStatus
   * @return {Promise<Object>}
   *
   * @link EntityNotificationsService#declinePromptNotification
   */
  static async requestToDeclinePrompt(myself, id, expectedStatus = 200) {
    const url = requestHelper.getDeclineNotificationUrl(id);

    const res = await request(server)
      .post(url)
      .set('Authorization', `Bearer ${myself.token}`)
    ;

    responseHelper.expectStatusToBe(res, expectedStatus);

    return res.body;
  }

  /**
   *
   * @param {Object} myself
   * @param {number} id
   * @param {number} expectedStatus
   * @return {Promise<Object>}
   *
   * @link EntityNotificationsService#pendingPromptNotification
   */
  static async requestToPendingPrompt(myself, id, expectedStatus = 200) {
    const url = requestHelper.getPendingNotificationUrl(id);

    const res = await request(server)
      .post(url)
      .set('Authorization', `Bearer ${myself.token}`)
    ;

    responseHelper.expectStatusToBe(res, expectedStatus);

    return res.body;
  }

  /**
   *
   * @param {Object} myself
   * @param {string} queryString
   * @param {boolean} dataOnly
   * @param {number} expectedStatus
   * @return {Promise<*>}
   *
   * @link EntityNotificationsService#getAllNotifications
   */
  static async requestToGetNotificationsList(myself, queryString = '', dataOnly = true, expectedStatus = 200) {

    const url = `${requestHelper.getMyselfNotificationsList()}/${queryString}`;

    const res = await request(server)
      .get(url)
      .set('Authorization', `Bearer ${myself.token}`)
    ;

    responseHelper.expectStatusToBe(res, expectedStatus);

    if (dataOnly) {
      return res.body.data;
    }

    return res.body;
  }

  public static async requestToGetOnlyOneNotification(myself: UserModel): Promise<any> {
    let notifications = [];
    let counter = 0;
    while (_.isEmpty(notifications)) {
      notifications = await this.requestToGetOnlyOneNotificationBeforeReceive(myself);
      delay(100);

      counter += 1;

      if (counter >= 900) {
        throw new AppError('Timeout is occurred. There are no any notifications');
      }
    }

    expect(notifications.length).toBe(1);

    return notifications[0];
  }

  /**
   *
   * @param {Object} myself
   * @param {number} requiredAmount
   * @return {Promise<*>}
   *
   * @link EntityNotificationsService#getAllNotifications
   */
  static async requestToGetExactNotificationsAmount(myself, requiredAmount = 1) {
    let notifications = [];
    while (_.isEmpty(notifications) || notifications.length < requiredAmount) {
      notifications = await this.requestToGetOnlyOneNotificationBeforeReceive(myself);
      delay(100);
    }

    return notifications;
  }

  // @deprecated - delete it in future
  static async requestToGetOnlyOneNotificationBeforeReceive(myself) {
    const url = requestHelper.getMyselfNotificationsList();

    const req = request(server)
      .get(url)
      .set('Authorization', `Bearer ${myself.token}`)
    ;

    const res = await req;

    responseHelper.expectStatusOk(res);

    return res.body.data;
  }

  /**
   *
   * @param {Object} model
   */
  static checkNotificationPrompt(model) {
    const mustExist = entityModelProvider.getNotificationsModel().getRequiredFields();
    responseHelper.expectFieldsAreExist(model, mustExist);
  }

  /**
   *
   * @param {Object} model
   */
  static checkNotificationItselfCommonFields(model) {
    this.checkNotificationPrompt(model);
  }

  /**
   *
   * @param {Object} model
   */
  static async checkAlertNotificationIsSeen(model) {
    const fromDb = await notificationsRepo.findNotificationItselfById(model.id);

    expect(fromDb.seen).toBeTruthy();
    expect(fromDb.finished).toBeTruthy();

    expect(model.finished).toBeTruthy();
  }

  /**
   *
   * @param {Object} model
   */
  static async checkPromptNotificationIsSeenButNotFinished(model) {
    const fromDb = await notificationsRepo.findNotificationItselfById(model.id);

    expect(fromDb.seen).toBeTruthy();
    expect(fromDb.finished).toBeFalsy();

    expect(model.finish).toBeFalsy();
  }

  /**
   *
   * @param {Object} model
   * @param {number} recipientId
   * @param {number} orgId
   * @param {boolean} isNew
   * @param {string} status
   */
  static checkUsersTeamInvitationPromptFromDb(
    model,
    recipientId,
    // @ts-ignore
    orgId,
    isNew = true,
    status: string | null = null,
  ) {
    const fieldsToCheck: any = {
      event_id: 10,
      recipient_entity_name: usersModelProvider.getEntityName(),
      recipient_entity_id: `${recipientId}`,
      // entity_name: OrgModelProvider.getEntityName(),
      // entity_id: "" + orgId,
    };

    if (isNew) {
      fieldsToCheck.finished   = false;
      fieldsToCheck.confirmed  = 0;
    } else if (status === 'confirmed') {
      fieldsToCheck.finished   = true;
      fieldsToCheck.confirmed  = notificationsStatusDictionary.getStatusConfirmed();
    } else if (status === 'declined') {
      fieldsToCheck.finished   = true;
      fieldsToCheck.confirmed  = notificationsStatusDictionary.getStatusDeclined();
    }

    expect(model).toMatchObject(fieldsToCheck);
  }
}

export = NotificationsHelper;
