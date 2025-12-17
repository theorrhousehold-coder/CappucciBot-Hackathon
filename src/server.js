const { App } = require('@slack/bolt');
require('dotenv').config();
const { loadData } = require('./dataManager');
const { registerCommands } = require('./commands');
const { schedulePairingRounds } = require('./scheduler');
const config = require('../config/config');

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
});

// Load data
const data = loadData();

// Register commands
registerCommands(app, data);

// Start server
(async () => {
  const port = process.env.PORT || 3000;PAIRING_INTERVAL_MINUTES
  await app.start(port);
  console.log('⚡️ CappucciBot is running!');
  console.log(`🚀 Listening on port ${port}`);
  
  // Start pairing scheduler
  schedulePairingRounds(app, data);
  console.log(`📅 Pairing scheduler started (every ${config.pairingIntervalMinutes} minutes)`);
})();
