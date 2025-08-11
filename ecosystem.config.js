module.exports = {
  apps: [
    {
      name: 'tsel-backend',
      script: 'server.js',
      instances: 'max', // Usar todos os cores disponíveis
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 3001
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
        HOST: '0.0.0.0',
        DB_HOST: 'localhost',
        DB_PORT: 5432,
        DB_NAME: 'tsel_db',
        DB_USER: 'tsel_user',
        DB_PASSWORD: 'tsel_password',
        DB_POOL_SIZE: 20,
        DB_IDLE_TIMEOUT: 30000,
        REDIS_HOST: 'localhost',
        REDIS_PORT: 6379,
        REDIS_PASSWORD: '',
        REDIS_DB: 0,
        JWT_SECRET: 'your-super-secret-jwt-key-change-this-in-production',
        JWT_EXPIRES_IN: '24h',
        JWT_REFRESH_EXPIRES_IN: '7d',
        BCRYPT_ROUNDS: 12,
        RATE_LIMIT_WINDOW_MS: 60000,
        RATE_LIMIT_MAX_REQUESTS: 100,
        UPLOAD_MAX_SIZE: '100mb',
        UPLOAD_PATH: './uploads',

        LOG_LEVEL: 'info',
        LOG_FILE: './logs/app.log',
        FRONTEND_URL: 'http://localhost:3000',
        CORS_ORIGIN: 'http://localhost:3000'
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_file: './logs/pm2-combined.log',
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 4000,
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 8000,
      shutdown_with_message: true,
      source_map_support: false,
      node_args: '--max-old-space-size=1024',
      cron_restart: '0 2 * * *', // Reiniciar diariamente às 2h da manhã
      ignore_watch: [
        'node_modules',
        'logs',
        'uploads',
        'backups',
        '.git'
      ],
      watch_options: {
        followSymlinks: false,
        usePolling: true
      }
    }
  ],

  deploy: {
    production: {
      user: 'ubuntu',
      host: 'your-server-ip',
      ref: 'origin/main',
      repo: 'git@github.com:your-username/tsel-backend.git',
      path: '/var/www/tsel-backend',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run migrate && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};
