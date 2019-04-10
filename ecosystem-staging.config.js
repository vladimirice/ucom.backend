/* eslint-disable unicorn/prevent-abbreviations,no-multi-spaces */
const NODE_ENV              = 'staging';

const HTTP_SERVER_PORT      = 3001;
const GRAPHQL_SERVER_PORT   = 4001;
const WEBSOCKET_SERVER_PORT = 5001;
const UPLOADER_SERVER_PORT  = 5011;

const CRON_PATTERN_EVERY_HOUR         = '0 */1 * * *';
const CRON_PATTERN_EVERY_MINUTE       = '* * * * *';
const CRON_PATTERN_EVERY_FIVE_MINUTES = '*/5 * * * *';

const clusterConfig = {
  instances: 'max',
  exec_mode: 'cluster',
};

const defaultConfig = {
  instance_var: 'INSTANCE_ID',
  watch: false,
  autorestart: true,
};

module.exports = {
  apps: [
    // ================ Apps (interaction with user) =============
    {
      name: `${NODE_ENV}_app_backend`,
      script: 'bin/www.js',

      ...clusterConfig,
      ...defaultConfig,

      env: {
        PORT: HTTP_SERVER_PORT,
        NODE_ENV,
      },
    },
    {
      name: `${NODE_ENV}_app_graphql`,
      script: 'bin/app-graphql.js',

      ...clusterConfig,
      ...defaultConfig,

      env: {
        PORT: GRAPHQL_SERVER_PORT,
        NODE_ENV,
      },
    },
    {
      name: `${NODE_ENV}_app_websocket`,
      instance_var: 'INSTANCE_ID',
      script: 'bin/app-websocket.js',

      // no cluster due to condition existence (connected users list)
      ...defaultConfig,

      env: {
        PORT: WEBSOCKET_SERVER_PORT,
        NODE_ENV,
      },
    },
    {
      name: `${NODE_ENV}_app_uploader`,
      script: 'bin/app-uploader.js',

      ...clusterConfig,
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
    // ================ Workers (CRON) ======================
    {
      name: `${NODE_ENV}_worker_airdrops_users_to_pending`,
      script: 'bin/workers-airdrops/airdrops-users-to-pending.js',
      watch: false,
      cron_restart: CRON_PATTERN_EVERY_MINUTE,
      env: {
        NODE_ENV,
      },
    },
    {
      name: `${NODE_ENV}_worker_airdrops_users_to_waiting`,
      script: 'bin/workers-airdrops/airdrops-users-to-waiting.js',
      watch: false,
      cron_restart: CRON_PATTERN_EVERY_MINUTE,
      env: {
        NODE_ENV,
      },
    },
    {
      name: `${NODE_ENV}_worker_update_importance`,
      script: 'bin/worker-update-importance.js',
      watch: false,
      cron_restart: CRON_PATTERN_EVERY_FIVE_MINUTES,
      env: {
        NODE_ENV,
      },
    },
    {
      name: `${NODE_ENV}_worker_update_tags_importance`,
      script: 'bin/worker-update-tag-importance.js',
      watch: false,
      cron_restart: CRON_PATTERN_EVERY_FIVE_MINUTES,
      env: {
        NODE_ENV,
      },
    },
    {
      name: `${NODE_ENV}_worker_update_blockchain_nodes`,
      script: 'bin/worker-update-blockchain-nodes.js',
      watch: false,
      cron_restart: CRON_PATTERN_EVERY_MINUTE,
      env: {
        NODE_ENV,
      },
    },
    {
      name: `${NODE_ENV}_worker_save_current_params`,
      script: 'bin/worker-save-current-params.js',
      watch: false,
      cron_restart: CRON_PATTERN_EVERY_HOUR,
      env: {
        NODE_ENV,
      },
    },
    {
      name: `${NODE_ENV}_worker_stats_calculate_event_params`,
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
      cron_restart: CRON_PATTERN_EVERY_HOUR,
      env: {
        NODE_ENV,
      },
    },
  ],
};
