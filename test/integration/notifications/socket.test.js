const io = require('socket.io-client');

const socketURL = 'http://localhost:3000';
// const socketURL = 'https://backend.u.community:443';
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiYWNjb3VudF9uYW1lIjoiYWRtaW5fYWNjb3VudF9uYW1lIiwiaWF0IjoxNTM0NDI0OTY4fQ.OBZCv4izTR0K6Mi6Fcjn3WT4N5MieKH5VpesY2WNfeM';

const options = {
  transports: ['websocket'],
  query: {token: token}
};

// var chatUser1 = {'name':'Tom'};
// var chatUser2 = {'name':'Sally'};
// var chatUser3 = {'name':'Dana'};

describe('Suite of unit tests', function() {

  var socket;

  beforeEach(function(done) {
    // Setup
    socket = io.connect(socketURL, {
      'reconnection delay' : 0
      , 'reopen delay' : 0
      , 'force new connection' : true,
      transports: ['websocket'],
      query: {token: token}
    });
    socket.on('connect', function() {
      console.log('worked...');
      done();
    });
    socket.on('disconnect', function() {
      console.log('disconnected...');
    });
    socket.on('notification', function(msg) {
      console.log('Message from socket: ', msg);
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

    it('Doing some things with indexOf()', function(done) {
      done();
    });

    it('Doing something else with indexOf()', function(done) {
      done();
    });

  });

});

it('Should broadcast new user to all users', async function() {

  // Place real token here, without Bearer

  // const socket = io('https://backend.u.community:443', {
  //   transports: [
  //     'websocket'
  //   ],
  //   query: {token: token}
  // });

  const client1 = await io.connect(socketURL, options);

  client1.on('connect', function(msg) {

    console.warn('connected');
    console.warn(JSON.stringify(msg, null, 2));
  });

  // client1.on('connect', function(data) {
    // client1.emit('connection name', chatUser1);
    //
    // /* Since first client is connected, we connect
    // the second client. */
    // var client2 = io.connect(socketURL, options);
    //
    // client2.on('connect', function(data){
    //   client2.emit('connection name', chatUser2);
    // });
    //
    // client2.on('new user', function(usersName){
    //   usersName.should.equal(chatUser2.name + " has joined.");
    //   client2.disconnect();
    // });
  // });

  // var numUsers = 0;
  // client1.on('new user', function(usersName){
  //   numUsers += 1;
  //
  //   if(numUsers === 2){
  //     usersName.should.equal(chatUser2.name + " has joined.");
  //     client1.disconnect();
  //     done();
  //   }
  // });
}, 10000);