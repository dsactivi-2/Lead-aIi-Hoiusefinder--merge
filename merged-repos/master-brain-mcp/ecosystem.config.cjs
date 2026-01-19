/**
 * PM2 Ecosystem Config für Master Brain MCP Hub
 *
 * Start: pm2 start ecosystem.config.cjs
 * Stop: pm2 stop master-brain-mcp
 * Logs: pm2 logs master-brain-mcp
 */

module.exports = {
  apps: [
    {
      name: 'master-brain-mcp',
      script: 'dist/index.js',
      cwd: '/root/master-brain-mcp',
      interpreter: 'node',

      // Environment
      env: {
        NODE_ENV: 'production',
        BRAIN_API_URL: 'http://localhost:3001',
        AUTO_MEMORY_ENABLED: 'true',
        AUTO_MEMORY_MIN_CONFIDENCE: '0.7',
      },

      // Process Management
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '256M',

      // Logging
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: '/root/master-brain-mcp/logs/error.log',
      out_file: '/root/master-brain-mcp/logs/out.log',
      merge_logs: true,

      // Restart Policy
      restart_delay: 5000,
      max_restarts: 10,
      min_uptime: '10s',
    },
  ],
};
