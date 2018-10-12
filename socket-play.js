const socket = require('socket.io-client')('http://localhost');

socket.on('error', () => {
  console.warn('error');
});

socket.on('connect', function(){
  console.warn('connected');
});
socket.on('event', function(data){});
socket.on('disconnect', function(){
  console.warn('disconnected');
});