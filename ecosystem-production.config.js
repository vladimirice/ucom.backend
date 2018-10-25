const NODE_ENV_PARAM = 'production';

module.exports = {
  apps : [
    {
      name:           `${NODE_ENV_PARAM}_backend`,
      instance_var:   'INSTANCE_ID',
      script:         'bin/www',
      watch:          false,
      autorestart:    true,
      env: {
        PORT:         3000,
        NODE_ENV:     NODE_ENV_PARAM,
      },
    },
    {
      name:           `${NODE_ENV_PARAM}_blockchain_consumer`,
      script:         'bin/blockchain-consumer.js',
      watch:          false,
      autorestart:    true,
      env: {
        NODE_ENV:     NODE_ENV_PARAM,
      },
    },
    {
      name:           `${NODE_ENV_PARAM}_notifications_consumer`,
      instance_var:   'INSTANCE_ID',
      script:         'bin/notifications-consumer.js',
      watch:          false,
      autorestart:    true,
      env: {
        NODE_ENV:     NODE_ENV_PARAM,
      },
    },
    {
      name: `${NODE_ENV_PARAM}_importance_worker`,
      script: 'bin/worker-update-importance.js',
      watch: false,
      cron_restart: '* * * * *',
      env: {
        NODE_ENV: NODE_ENV_PARAM
      },
    },
  ],
};
