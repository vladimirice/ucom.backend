const http = require('http');
const app = require('../lib/static-renderer/static-renderer-app');

// noinspection JSValidateTypes
const server = http.Server(app);

const port = process.env.PORT;
server.listen(port, function() {
  console.log(`listening on *:${port}`);
});
