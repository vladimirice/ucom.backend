"use strict";
const express = require('express');
require('express-async-errors');
const router = express.Router();
const authTokenMiddleWare = require('../lib/auth/auth-token-middleware');
const { cpUpload } = require('../lib/users/avatar-upload-middleware');
/**
 * @param {Object} req
 * @returns {PostService}
 */
function getPostService(req) {
    return req.container.get('post-service');
}
function getEntityNotificationsService(req) {
    return req.container.get('entity-notifications-service');
}
function getBlockchainService(req) {
    return req.container.get('blockchain-service');
}
/**
 *
 * @param {Object} req
 * @returns {userService}
 */
function getUserService(req) {
    return req.container.get('user-service');
}
/* Get myself data (Information for profile) */
router.get('/', [authTokenMiddleWare], async (req, res) => {
    const currentUserId = req.user.id;
    const user = await getUserService(req).getUserByIdAndProcess(currentUserId);
    res.send(user);
});
/* Get myself blockchain transactions */
router.get('/blockchain/transactions', [authTokenMiddleWare], async (req, res) => {
    const service = getBlockchainService(req);
    const response = await service.getAndProcessMyselfBlockchainTransactions(req.query);
    res.send(response);
});
router.get('/news-feed', [authTokenMiddleWare], async (req, res) => {
    const { query } = req;
    const response = await getPostService(req).findAndProcessAllForMyselfNewsFeed(query);
    res.send(response);
});
router.get('/notifications', [authTokenMiddleWare], async (req, res) => {
    const { query } = req;
    const service = getEntityNotificationsService(req);
    const response = await service.getAllNotifications(query);
    res.send(response);
});
router.post('/notifications/:notification_id/confirm', [authTokenMiddleWare], async (req, res) => {
    const notificationId = +req.params.notification_id;
    const service = getEntityNotificationsService(req);
    const response = await service.confirmPromptNotification(notificationId);
    res.send(response);
});
router.post('/notifications/:notification_id/decline', [authTokenMiddleWare], async (req, res) => {
    const notificationId = +req.params.notification_id;
    const service = getEntityNotificationsService(req);
    const response = await service.declinePromptNotification(notificationId);
    res.send(response);
});
router.post('/notifications/:notification_id/seen', [authTokenMiddleWare], async (req, res) => {
    const notificationId = +req.params.notification_id;
    const service = getEntityNotificationsService(req);
    const response = await service.markNotificationAsSeen(notificationId);
    res.send(response);
});
/* Update Myself Profile */
router.patch('/', [authTokenMiddleWare, cpUpload], async (req, res) => {
    const service = getUserService(req);
    const response = await service.processUserUpdating(req);
    res.send(response);
});
module.exports = router;
