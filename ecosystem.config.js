module.exports = {
  apps : [
    // *********** production applications *********** //
    {
      name:           'production_uos_backend',
      instance_var:   'INSTANCE_ID',
      script:         'bin/www',
      watch:          false,
      autorestart:    true,
      env: {
        PORT:         3000,
        NODE_ENV:     'test',
        watch:        true,
      },
      env_production: {
        PORT:         3000,
        NODE_ENV:     'production',
        watch:        false,
        autorestart:  true,
      },
    },
    {
      name:           'production_uos_backend_blockchain_consumer',
      script:         'bin/blockchain-consumer.js',
      watch:          false,
      autorestart:    false,
      env: {
        NODE_ENV:     'test',
        watch:          true,
        autorestart:    true,
      },
      env_production: {
        NODE_ENV:     'production',
        watch:          false,
        autorestart:    false,
      },
    },
    {
      name:           'production_uos_backend_notifications_consumer',
      instance_var:   'INSTANCE_ID',
      script:         'bin/notifications-consumer.js',
      watch:          false,
      autorestart:    false,
      env: {
        NODE_ENV:     'test',
        watch:          true,
        autorestart:    true,
      },
      env_production: {
        NODE_ENV:     'production',
        watch:          false,
        autorestart:    false,
      },
    },
    {
      name: 'production_uos_backend_importance_worker',
      script: 'bin/worker-update-importance.js',
      watch: false,
      cron_restart: '* * * * *',
      env: {
        NODE_ENV: 'test'
      },
      env_production : {
        NODE_ENV: 'production',
      },
    },

    // *********** staging applications *********** //
    {
      name:           'staging_uos_backend',
      instance_var:   'INSTANCE_ID',
      script:         'bin/www',
      watch:          false,
      autorestart:    true,
      env: {
        PORT:         3001,
        NODE_ENV:     'staging',
      },
      env_production: {
        PORT:         3001,
        NODE_ENV:     'staging',
      },
    },
    {
      name:           'staging_uos_backend_blockchain_consumer',
      script:         'bin/blockchain-consumer.js',
      watch:          false,
      autorestart:    false,
      env: {
        NODE_ENV:     'staging',
      },
      env_production: {
        NODE_ENV:     'staging',
      },
    },
    {
      name: 'staging_uos_backend_importance_worker',
      script: 'bin/worker-update-importance.js',
      watch: false,
      cron_restart: '* * * * *',
      env: {
        NODE_ENV: 'staging'
      },
      env_production : {
        NODE_ENV: 'staging',
      },
    },
    // {
    //   name: 'uos_backend_ipfs_consumer',
    //   script: 'bin/ipfs-consumer.js',
    //   watch: true,
    //   env: {
    //     "NODE_ENV": "development"
    //   },
    //   env_production : {
    //     NODE_ENV: 'production',
    //     watch: false,
    //   },
    //   env_test : {
    //     NODE_ENV: 'test',
    //   },
    // },
  ],
};
