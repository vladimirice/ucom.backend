const express = require('express');
const router  = express.Router();

const UserService         = require('../lib/users/users-service');
const authTokenMiddleWare = require('../lib/auth/auth-token-middleware');
const { cpUpload }        = require('../lib/users/avatar-upload-middleware');

/* Get myself data (Information for profile) */
router.get('/', [ authTokenMiddleWare ], async function(req, res) {
  const currentUserId = req['user'].id;
  const user = await getUserService(req).getUserByIdAndProcess(currentUserId);

  res.send(user);
});

/* Get myself blockchain transactions */
router.get('/blockchain/transactions', [ authTokenMiddleWare ], async function(req, res) {
  const service = getBlockchainService(req);
  const response = await service.getAndProcessMyselfBlockchainTransactions();

  res.send(response);
});

router.get('/news-feed', [ authTokenMiddleWare ], async function(req, res) {
  const query = req.query;

  const response = await getPostService(req).findAndProcessAllForMyselfNewsFeed(query);

  res.send(response);
});

router.get('/notifications', [ authTokenMiddleWare ], async (req, res) => {
  const query = req.query;
  const service = getEntityNotificationsService(req);

  const response = await service.getAllNotifications(query);

  res.send(response);
});

router.post('/notifications/:notification_id/confirm', [ authTokenMiddleWare ], async (req, res) => {
  const notificationId = +req.params.notification_id;
  const service = getEntityNotificationsService(req);

  const response = await service.confirmPromptNotification(notificationId);

  res.send(response);
});

router.post('/notifications/:notification_id/decline', [ authTokenMiddleWare ], async (req, res) => {
  const notificationId = +req.params.notification_id;
  const service = getEntityNotificationsService(req);

  const response = await service.declinePromptNotification(notificationId);

  res.send(response);
});

router.post('/notifications/:notification_id/seen', [ authTokenMiddleWare ], async (req, res) => {
  const notificationId = +req.params.notification_id;
  const service = getEntityNotificationsService(req);

  const response = await service.markNotificationAsSeen(notificationId);

  res.send(response);
});

/* Update Myself Profile */
router.patch('/', [authTokenMiddleWare, cpUpload], async function(req, res) {
  const service = getUserService(req);
  const response = await service.processUserUpdating(req);

  res.send(response);
});

/**
 *
 * @param {Object} req
 * @returns {UserService}
 */
function getUserService(req) {
  return req['container'].get('user-service');
}

/**
 * @param {Object} req
 * @returns {PostService}
 */
function getPostService(req) {
  return req['container'].get('post-service');
}

/**
 * @param {Object} req
 * @returns {EntityNotificationsService}
 */
function getEntityNotificationsService(req) {
  return req.container.get('entity-notifications-service');
}

/**
 * @param {Object} req
 * @returns {BlockchainService}
 */
function getBlockchainService(req) {
  return req['container'].get('blockchain-service');
}

module.exports = router;