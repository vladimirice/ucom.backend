import DiServiceLocator = require('../lib/api/services/di-service-locator');
import EntityNotificationsService = require('../lib/entities/service/entity-notifications-service');
import BlockchainTrTracesFetchService = require('../lib/eos/service/tr-traces-service/blockchain-tr-traces-fetch-service');
import UsersFetchService = require('../lib/users/service/users-fetch-service');
import { UserModel } from '../lib/users/interfaces/model-interfaces';
import UsersService = require('../lib/users/users-service');

const express = require('express');
require('express-async-errors');

const router = express.Router();

const authTokenMiddleWare = require('../lib/auth/auth-token-middleware');
const { cpUpload } = require('../lib/users/avatar-upload-middleware');

/* Get myself data (Information for profile) */
router.get('/', [authTokenMiddleWare], async (req, res) => {
  const currentUser = DiServiceLocator.getCurrentUserOrException(req);

  const user: UserModel = await UsersFetchService.findOneAndProcessFully(currentUser.id, currentUser.id);

  res.send(user);
});

/* Get myself blockchain transactions */
router.get('/blockchain/transactions', [authTokenMiddleWare], async (req, res) => {
  const currentUser = DiServiceLocator.getCurrentUserOrException(req);

  const response = BlockchainTrTracesFetchService.getAndProcessOneUserTraces(req.query, currentUser.account_name);

  res.send(response);
});

router.get('/notifications', [authTokenMiddleWare], async (req, res) => {
  const { query } = req;

  const userId = DiServiceLocator.getCurrentUserIdOrException(req);
  const response = await EntityNotificationsService.getAllNotifications(query, userId);

  res.send(response);
});

router.post('/notifications/:notification_id/confirm', [authTokenMiddleWare], async (req, res) => {
  const notificationId = +req.params.notification_id;
  const userId = DiServiceLocator.getCurrentUserIdOrException(req);

  const response = await EntityNotificationsService.confirmPromptNotification(notificationId, userId);

  res.send(response);
});

router.post('/notifications/:notification_id/decline', [authTokenMiddleWare], async (req, res) => {
  const notificationId = +req.params.notification_id;
  const userId = DiServiceLocator.getCurrentUserIdOrException(req);

  const response = await EntityNotificationsService.declinePromptNotification(notificationId, userId);

  res.send(response);
});

router.post('/notifications/:notification_id/seen', [authTokenMiddleWare], async (req, res) => {
  const notificationId = +req.params.notification_id;

  const userId = DiServiceLocator.getCurrentUserIdOrException(req);

  const response = await EntityNotificationsService.markNotificationAsSeen(notificationId, userId);

  res.send(response);
});

/* Update Myself Profile */
router.patch('/', [authTokenMiddleWare, cpUpload], async (req, res) => {
  const currentUser = DiServiceLocator.getCurrentUserOrException(req);
  const response = await UsersService.processUserUpdating(req, currentUser);

  res.send(response);
});

// @ts-ignore
export = router;
