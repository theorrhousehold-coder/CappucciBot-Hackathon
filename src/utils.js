function getTimeUntilNextRound() {
  const config = require('../config/config');
  const interval = config.pairingIntervalMinutes;
  
  const now = new Date();
  const nextRound = new Date(now);
  nextRound.setMinutes(Math.ceil(now.getMinutes() / interval) * interval, 0, 0);
  
  if (nextRound <= now) {
    nextRound.setMinutes(nextRound.getMinutes() + interval);
  }
  
  const diffMs = nextRound - now;
  const diffMins = Math.floor(diffMs / 60000);
  
  return `${diffMins} minute${diffMins !== 1 ? 's' : ''}`;
}

module.exports = {
  getTimeUntilNextRound
};
