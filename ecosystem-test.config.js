// !!!! Websocket server is not tested so it is not included to test config !!!!

const NODE_ENV              = 'test';
const HTTP_SERVER_PORT      = 3000;
const STATIC_RENDERER_PORT  = 3010;
const IGNORE_WATCH = ["node_modules", "public", "logs"];

module.exports = {
  apps : [
    // ================ Services ======================
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
    {
      name:           `${NODE_ENV}_static_renderer`,
      instance_var:   'INSTANCE_ID',
      script:         'bin/service-static-renderer.js',
      watch:          true,
      ignore_watch:   IGNORE_WATCH,
      env: {
        PORT:         STATIC_RENDERER_PORT,
        NODE_ENV:     NODE_ENV,
        autorestart:  true,
      },
    },

    // ================ Consumers ======================
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
