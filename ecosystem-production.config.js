const NODE_ENV              = 'production';
const HTTP_SERVER_PORT      = 3000;
const WEBSOCKET_SERVER_PORT = 5000;

module.exports = {
  apps : [
    {
      name:           `${NODE_ENV}_backend`,
      instance_var:   'INSTANCE_ID',
      script:         'bin/www',
      watch:          false,
      autorestart:    true,
      env: {
        PORT:         HTTP_SERVER_PORT,
        NODE_ENV:     NODE_ENV,
      },
    },
    {
      name:           `${NODE_ENV}_websocket`,
      instance_var:   'INSTANCE_ID',
      script:         'bin/websocket.js',
      env: {
        PORT:         WEBSOCKET_SERVER_PORT,
        NODE_ENV:     NODE_ENV,
        watch:        false,
        autorestart:  true,
      },
    },
    {
      name:           `${NODE_ENV}_blockchain_consumer`,
      script:         'bin/blockchain-consumer.js',
      watch:          false,
      autorestart:    true,
      env: {
        NODE_ENV:     NODE_ENV,
      },
    },
    {
      name:           `${NODE_ENV}_notifications_consumer`,
      instance_var:   'INSTANCE_ID',
      script:         'bin/notifications-consumer.js',
      watch:          false,
      autorestart:    true,
      env: {
        NODE_ENV:     NODE_ENV,
      },
    },
    {
      name: `${NODE_ENV}_importance_worker`,
      script: 'bin/worker-update-importance.js',
      watch: false,
      cron_restart: '*/5 * * * *',
      env: {
        NODE_ENV: NODE_ENV
      },
    },
    {
      name: `${NODE_ENV}_update_blockchain_nodes`,
      script: 'bin/worker-update-blockchain-nodes.js',
      watch: false,
      cron_restart: '* * * * *',
      env: {
        NODE_ENV: NODE_ENV
      },
    },
    {
      name: `${NODE_ENV}_update_stats`,
      script: 'bin/worker-update-stats.js',
      watch: false,
      cron_restart: '0 3 * * *',
      env: {
        NODE_ENV: NODE_ENV
      },
    },
  ],
};
