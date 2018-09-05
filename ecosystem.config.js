module.exports = {
  apps : [{
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
  }
  ],
  "deploy" : {
    "production" : {
      "user" : "dev",
      "host" : ["5.9.119.5"],
      "ref"  : "origin/master",
      "repo" : "git@bitbucket.org:gravityprotocol/uos.app.backend.git",
      "path" : "/var/www/uos.app.backend",
      "post-deploy" : "npm install && pm2 startOrRestart ecosystem.json --env production"
    },
  }
};

{


}
