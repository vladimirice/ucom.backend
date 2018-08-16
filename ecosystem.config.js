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
    env_production : {
      NODE_ENV: 'production'
    },
    env_test : {
      NODE_ENV: 'test'
    }
  }],
};

{


}
