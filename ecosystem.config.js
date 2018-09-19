module.exports = {
  apps : [
    {
      name      : 'uos_backend',
      script    : 'bin/www',
      watch: true,
      instance_var: 'INSTANCE_ID',
      env: {
        "PORT": 3000,
        "NODE_ENV": "development"
      },
      autorestart: true,
      env_production : {
        NODE_ENV: 'production',
        watch: false,
      },
      env_test : {
        NODE_ENV: 'test'
      }
    },
    {
      name: 'uos_backend_importance_worker',
      script: 'bin/worker-update-importance.js',
      watch: false,
      cron_restart: "* * * * *",
      env: {
        "NODE_ENV": "development"
      },
      env_production : {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'uos_backend_ipfs_consumer',
      script: 'bin/ipfs-consumer.js',
      watch: true,
      env: {
        "NODE_ENV": "development"
      },
      env_production : {
        NODE_ENV: 'production',
        watch: false,
      },
      env_test : {
        NODE_ENV: 'test',
      },
    },
    {
      name: 'uos_backend_blockchain_consumer',
      script: 'bin/blockchain-consumer.js',
      watch: true,
      env: {
        "NODE_ENV": "development"
      },
      env_production : {
        NODE_ENV: 'production',
        watch: false,
      },
      env_test : {
        NODE_ENV: 'test',
      },
    }
  ],
};
