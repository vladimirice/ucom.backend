const NODE_ENV              = 'test';
const HTTP_SERVER_PORT      = 3000;
// const WEBSOCKET_SERVER_PORT = 5000;
const IGNORE_WATCH = ["node_modules", "public", "logs"];

module.exports = {
  apps : [
    {
      name:           `${NODE_ENV}_backend`,
      instance_var:   'INSTANCE_ID',
      script:         'bin/www',
      watch:          true,
      ignore_watch:   IGNORE_WATCH,
      env: {
        PORT:         HTTP_SERVER_PORT,
        NODE_ENV:     NODE_ENV,
        autorestart:  true,
      },
    },
    // {
    //   name:           `${NODE_ENV}_websocket`,
    //   instance_var:   'INSTANCE_ID',
    //   script:         'bin/websocket.js',
    //   watch:          true,
    //   ignore_watch:   IGNORE_WATCH,
    //   env: {
    //     PORT:         WEBSOCKET_SERVER_PORT,
    //     NODE_ENV:     NODE_ENV,
    //     autorestart:  true,
    //   },
    // },
    {
      name:           `${NODE_ENV}_blockchain_consumer`,
      script:         'bin/blockchain-consumer.js',
      watch:          true,
      ignore_watch:   IGNORE_WATCH,
      env: {
        NODE_ENV:     NODE_ENV,
        autorestart:  true,
      },
    },
    {
      name:           `${NODE_ENV}_notifications_consumer`,
      instance_var:   'INSTANCE_ID',
      script:         'bin/notifications-consumer.js',
      watch:          true,
      ignore_watch:   IGNORE_WATCH,
      env: {
        NODE_ENV:     NODE_ENV,
        autorestart:  true,
      },
    },
  ],
};
