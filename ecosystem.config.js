module.exports = {
  apps : [{
    name               : 'api',
    script             : './bin/www',
    cwd	               : '/var/www/api_server/',
    exec_mode          : 'cluster',
    instances          : 4,
    max_memory_restart : '500M',
    log_date_format    : 'DD-MM HH:mm:ss',
    merge_logs         : true,
    env: {
      NODE_ENV         : 'development'
    },
    env_production : {
      NODE_ENV         : 'production'
    }
  }]
};
