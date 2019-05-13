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
      name: `${NODE_ENV}-app-backend`,
      script: 'lib/api/bin/api-bin.js',

      ...defaultConfig,

      env: {
        PORT: HTTP_SERVER_PORT,
        NODE_ENV,
      },
    },
    {
      name: `${NODE_ENV}-app-graphql`,
      script: 'lib/graphql/bin/graphql-bin.js',

      ...defaultConfig,

      env: {
        PORT: GRAPHQL_SERVER_PORT,
        NODE_ENV,
      },
    },
    {
      name: `${NODE_ENV}-app-websocket`,
      script: 'lib/websockets/bin/websockets-bin.js',

      ...defaultConfig,

      env: {
        PORT: WEBSOCKET_SERVER_PORT,
        NODE_ENV,
      },
    },
    {
      name: `${NODE_ENV}-app-uploader`,
      script: 'lib/uploader/bin/uploader-bin.js',

      ...defaultConfig,

      env: {
        PORT: UPLOADER_SERVER_PORT,
        NODE_ENV,
      },
    },
    // ================ Consumers ======================
    {
      name: `${NODE_ENV}-consumer-tags-parser`,
      script: 'lib/tags/consumers/tags-parser-consumer.js',

      ...defaultConfig,

      env: {
        NODE_ENV,
      },
    },
    {
      name: `${NODE_ENV}-consumer-transaction-sender`,
      script: 'lib/eos/consumers/transaction-sender-consumer.js',

      ...defaultConfig,

      env: {
        NODE_ENV,
      },
    },
    {
      name: `${NODE_ENV}-consumer-notifications-sender`,
      script: 'lib/entities/consumers/notifications-sender-consumer.js',

      ...defaultConfig,

      env: {
        NODE_ENV,
      },
    },
  ],
};
