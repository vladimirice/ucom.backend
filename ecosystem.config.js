module.exports = {
  apps : [{
    name      : 'uos_backend',
    script    : 'bin/www',
    env: {
      NODE_ENV: 'development'
    },
    env_production : {
      NODE_ENV: 'production'
    },
    env_test : {
      NODE_ENV: 'test'
    }
  }],
};
