const NODE_ENV = 'test';

module.exports = {
  apps : [
    {
      name:           `${NODE_ENV}_backend`,
      instance_var:   'INSTANCE_ID',
      script:         'bin/www',
      env: {
        PORT:         3000,
        NODE_ENV:     NODE_ENV,
        watch:        true,
        autorestart:  true,
      },
    },
    {
      name:           `${NODE_ENV}_blockchain_consumer`,
      script:         'bin/blockchain-consumer.js',
      env: {
        NODE_ENV:     NODE_ENV,
        watch:        true,
        autorestart:  true,
      },
    },
    {
      name:           `${NODE_ENV}_notifications_consumer`,
      instance_var:   'INSTANCE_ID',
      script:         'bin/notifications-consumer.js',
      env: {
        NODE_ENV:     NODE_ENV,
        watch:        true,
        autorestart:  true,
      },
    },
  ],
};
