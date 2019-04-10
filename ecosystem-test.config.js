/* eslint-disable unicorn/prevent-abbreviations */
const NODE_ENV = 'test';
const HTTP_SERVER_PORT = 3000;
const WEBSOCKET_SERVER_PORT = 5000;
const UPLOADER_SERVER_PORT = 5010;
const GRAPHQL_SERVER_PORT = 4010;
const IGNORE_WATCH = ['node_modules', 'public', 'logs'];


const defaultConfig = {
  instance_var: 'INSTANCE_ID',
  watch: true,
  autorestart: true,
  ignore_watch: IGNORE_WATCH,
};

module.exports = {
  apps: [
    // ================ Apps (interaction with user) =============
    {
      name: `${NODE_ENV}_backend`,
      script: 'bin/www.js',

      ...defaultConfig,

      env: {
        PORT: HTTP_SERVER_PORT,
        NODE_ENV,
      },
    },
    {
      name: `${NODE_ENV}_app_graphql`,
      script: 'bin/app-graphql.js',

      ...defaultConfig,

      env: {
        PORT: GRAPHQL_SERVER_PORT,
        NODE_ENV,
      },
    },
    {
      name: `${NODE_ENV}_app_websocket`,
      script: 'bin/app-websocket.js',

      ...defaultConfig,

      env: {
        PORT: WEBSOCKET_SERVER_PORT,
        NODE_ENV,
      },
    },
    {
      name: `${NODE_ENV}_app_uploader`,
      script: 'bin/app-uploader.js',

      ...defaultConfig,

      env: {
        PORT: UPLOADER_SERVER_PORT,
        NODE_ENV,
      },
    },
    // ================ Consumers ======================
    {
      name: `${NODE_ENV}_consumer_tags_parser`,
      script: 'bin/consumer-tags-parser.js',

      ...defaultConfig,

      env: {
        NODE_ENV,
      },
    },
    {
      name: `${NODE_ENV}_consumer_transaction_sender`,
      script: 'bin/consumer-transaction-sender.js',

      ...defaultConfig,

      env: {
        NODE_ENV,
      },
    },
    {
      name: `${NODE_ENV}_consumer_notifications_sender`,
      script: 'bin/consumer-notifications-sender.js',

      ...defaultConfig,

      env: {
        NODE_ENV,
      },
    },
  ],
};
