module.exports = {
  apps: [{
    name: 'lead-builder-frontend',
    script: 'npm',
    args: 'start',
    cwd: '/root/lead-builder-frontend',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
