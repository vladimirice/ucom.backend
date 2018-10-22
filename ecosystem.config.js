module.exports = {
  apps : [
    {
      name:           'uos_backend',
      instance_var:   'INSTANCE_ID',
      script:         'bin/www',
      watch:          false,
      autorestart:    true,
      env: {
        PORT:         3002,
        NODE_ENV:     'development',
        watch:        true,
      },
      env_test : {
        PORT:         3000,
        NODE_ENV:     'test',
      },
      env_production: {
        PORT:         3000,
        NODE_ENV:     'production',
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
    },
    {
      name:           'staging_uos_backend_blockchain_consumer',
      script:         'bin/blockchain-consumer.js',
      watch:          false,
      autorestart:    true,
      env: {
        NODE_ENV:     'staging',
      },
    },
    // {
    //   name: 'uos_backend_importance_worker',
    //   script: 'bin/worker-update-importance.js',
    //   watch: false,
    //   cron_restart: "* * * * *",
    //   env: {
    //     "NODE_ENV": "development"
    //   },
    //   env_production : {
    //     NODE_ENV: 'production',
    //   },
    // },
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
    // {
    //   name: 'uos_backend_blockchain_consumer',
    //   script: 'bin/blockchain-consumer.js',
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
    // {
    //   name: 'uos_backend_staging_importance_worker',
    //   script: 'bin/worker-update-importance.js',
    //   watch: false,
    //   cron_restart: "* * * * *",
    //   env: {
    //     "NODE_ENV": "staging"
    //   },
    //   env_production : {
    //     NODE_ENV: 'staging',
    //   },
    // },
  ],
};
