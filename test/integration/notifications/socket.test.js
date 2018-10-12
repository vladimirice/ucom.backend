const io = require('socket.io-client');

const socketURL = 'http://localhost:3000';

const options ={
  transports: ['websocket'],
  'force new connection': true
};

// var chatUser1 = {'name':'Tom'};
// var chatUser2 = {'name':'Sally'};
// var chatUser3 = {'name':'Dana'};

it.skip('Should broadcast new user to all users', async function(done) {
  const client1 = await io.connect(socketURL, options);

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