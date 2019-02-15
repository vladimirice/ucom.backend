const NODE_ENV = 'production';
const HTTP_SERVER_PORT = 3000;
const WEBSOCKET_SERVER_PORT = 5000;
const GRAPHQL_SERVER_PORT = 4000;

module.exports = {
  apps: [
    // ================ Apps (interaction with user) =============
    {
      name: `${NODE_ENV}_app_backend`,
      instance_var: 'INSTANCE_ID',
      script: 'bin/www.js',
      instances: 'max',
      exec_mode: 'cluster',
      watch: false,
      autorestart: true,
      env: {
        PORT: HTTP_SERVER_PORT,
        NODE_ENV,
      },
    },
    {
      name: `${NODE_ENV}_app_graphql`,
      instance_var: 'INSTANCE_ID',
      script: 'bin/app-graphql.js',
      instances: 'max',
      exec_mode: 'cluster',
      watch: false,
      autorestart: true,
      env: {
        PORT: GRAPHQL_SERVER_PORT,
        NODE_ENV,
      },
    },
    {
      name: `${NODE_ENV}_app_websocket`,
      instance_var: 'INSTANCE_ID',
      script: 'bin/app-websocket.js',
      env: {
        PORT: WEBSOCKET_SERVER_PORT,
        NODE_ENV,
        watch: false,
        autorestart: true,
      },
    },
    // ================ Consumers ======================
    {
      name: `${NODE_ENV}_consumer_tags_parser`,
      script: 'bin/consumer-tags-parser.js',
      watch: false,
      autorestart: true,
      env: {
        NODE_ENV,
        autorestart: true,
      },
    },
    {
      name: `${NODE_ENV}_consumer_transaction_sender`,
      script: 'bin/consumer-transaction-sender.js',
      watch: false,
      autorestart: true,
      env: {
        NODE_ENV,
      },
    },
    {
      name: `${NODE_ENV}_consumer_notifications_sender`,
      instance_var: 'INSTANCE_ID',
      script: 'bin/consumer-notifications-sender.js',
      watch: false,
      autorestart: true,
      env: {
        NODE_ENV,
      },
    },
    // ================ Workers (CRON) ======================
    {
      name: `${NODE_ENV}_worker_update_importance`,
      script: 'bin/worker-update-importance.js',
      watch: false,
      cron_restart: '*/5 * * * *',
      env: {
        NODE_ENV,
      },
    },
    {
      name: `${NODE_ENV}_worker_update_tags_importance`,
      script: 'bin/worker-update-tag-importance.js',
      watch: false,
      cron_restart: '*/5 * * * *',
      env: {
        NODE_ENV,
      },
    },
    {
      name: `${NODE_ENV}_worker_update_blockchain_nodes`,
      script: 'bin/worker-update-blockchain-nodes.js',
      watch: false,
      cron_restart: '* * * * *',
      env: {
        NODE_ENV,
      },
    },
    {
      name: `${NODE_ENV}_worker_update_stats`,
      script: 'bin/worker-update-stats.js',
      watch: false,
      cron_restart: '0 */1 * * *',
      env: {
        NODE_ENV,
      },
    },
    {
      name: `${NODE_ENV}_worker_save_current_params`,
      script: 'bin/worker-stats-calculate-event-params.js',
      watch: false,
      cron_restart: '30 */1 * * *',
      env: {
        NODE_ENV,
      },
    },
    {
      name: `${NODE_ENV}_worker_sync_tr_traces`,
      script: 'bin/worker-sync-tr-traces.js',
      watch: false,
      cron_restart: '0 * * * *',
      env: {
        NODE_ENV,
      },
    },
  ],
};
