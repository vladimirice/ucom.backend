const io = require('socket.io-client');

const config        = require('config');
const websocketHost = config.servers.websocket;

const delay = require('delay');

const gen     = require('../../generators');
const helpers = require('../helpers');
const RabbitMqService = require('../../../lib/jobs/rabbitmq-service');

// local token
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiYWNjb3VudF9uYW1lIjoiYWRtaW5fYWNjb3VudF9uYW1lIiwiaWF0IjoxNTM0NDI0OTY4fQ.OBZCv4izTR0K6Mi6Fcjn3WT4N5MieKH5VpesY2WNfeM';
// const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OSwiYWNjb3VudF9uYW1lIjoidmFzeWFwdXBraW4zIiwiaWF0IjoxNTQwNTQ5NjYyfQ.mvZ2WvBol2y3WDlR53ftHOtNqKZECsyweeVLOOmLrAg';

let userVlad;
let userJane;
let userPetr;
let userRokky;

let socket;

helpers.Mock.mockAllTransactionSigning();
helpers.Mock.mockAllBlockchainJobProducers();

describe('Suite of unit tests', function() {
  beforeAll(async () => {
    [userVlad, userJane, userPetr, userRokky] = await helpers.SeedsHelper.beforeAllRoutine();
  });

  afterAll(async () => {
    await helpers.SeedsHelper.sequelizeAfterAll();
  });

  beforeEach(async (done) => {
    await RabbitMqService.purgeNotificationsQueue();
    await helpers.SeedsHelper.initUsersOnly();

    socket = io(websocketHost, {
      transports: [
        'websocket'
      ],
      query: {token: token}
    });

    // Setup
    // socket = io.connect(websocketHost, {
    //   'reconnection delay' : 0
    //   , 'reopen delay' : 0
    //   , 'force new connection' : true,
    //   transports: ['websocket'],
    //   query: {token: token}
    // });
    socket.on('connect', function() {
      console.log('worked...');
      done();
    });

    socket.on('*', (event, data) => {
      console.log(event);
      console.log(data);
      done();
    });

    socket.on('disconnect', function() {
      console.log('disconnected...');
    });
  });

  afterEach(function(done) {
    // Cleanup
    if(socket.connected) {
      console.log('disconnecting...');
      socket.disconnect();
    } else {
      // There will not be a connection unless you have done() in beforeEach, socket.on('connect'...)
      console.log('no connection to break...');
    }
    done();
  });

  describe('First (hopefully useful) test', function() {
    it.skip('Doing some things with indexOf()', async () => {

      socket.on('notification', function(msg) {
        console.warn('Message from socket: ', msg);
      });

      const postId = await gen.Posts.createMediaPostByUserHimself(userVlad);
      await helpers.Posts.requestToUpvotePost(userJane, postId);

      const notification = await helpers.Notifications.requestToGetOnlyOneNotification(userVlad);
    }, 30000);
  });
});