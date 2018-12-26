const NODE_ENV                = 'test';
const HTTP_SERVER_PORT        = 3000;
const STATIC_RENDERER_PORT    = 3010;
const WEBSOCKET_SERVER_PORT   = 5000;
const IGNORE_WATCH = ["node_modules", "public", "logs"];

module.exports = {
  apps : [
    // ================ Apps (interaction with user) =============
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
      name:           `${NODE_ENV}_app_static_renderer`,
      instance_var:   'INSTANCE_ID',
      script:         'bin/app-static-renderer.js',
      watch:          true,
      ignore_watch:   IGNORE_WATCH,
      env: {
        PORT:         STATIC_RENDERER_PORT,
        NODE_ENV:     NODE_ENV,
        autorestart:  true,
      },
    },
    {
      name:           `${NODE_ENV}_app_websocket`,
      instance_var:   'INSTANCE_ID',
      script:         'bin/app-websocket.js',
      watch:          true,
      ignore_watch:   IGNORE_WATCH,
      env: {
        PORT:         WEBSOCKET_SERVER_PORT,
        NODE_ENV:     NODE_ENV,
        autorestart:  true,
      },
    },
    // ================ Consumers ======================
    {
      name:           `${NODE_ENV}_consumer_tags_parser`,
      script:         'bin/consumer-tags-parser.js',
      watch:          true,
      env: {
        NODE_ENV:     NODE_ENV,
        autorestart:  true,
        watch: true,
      },
    },
    {
      name:           `${NODE_ENV}_consumer_transaction_sender`,
      script:         'bin/consumer-transaction-sender.js',
      watch:          true,
      ignore_watch:   IGNORE_WATCH,
      env: {
        NODE_ENV:     NODE_ENV,
        autorestart:  true,
      },
    },
    {
      name:           `${NODE_ENV}_consumer_notifications_sender`,
      instance_var:   'INSTANCE_ID',
      script:         'bin/consumer-notifications-sender.js',
      watch:          true,
      ignore_watch:   IGNORE_WATCH,
      env: {
        NODE_ENV:     NODE_ENV,
        autorestart:  true,
      },
    },
  ],
};
