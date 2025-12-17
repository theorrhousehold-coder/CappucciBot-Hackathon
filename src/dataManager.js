const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../data/data.json');

function loadData() {
  if (fs.existsSync(DATA_FILE)) {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  }
  return {
    queues: {}, // { "location": [{ userId, userName, joinedAt, roundsInQueue }] }
    users: {}, // { userId: { name, location, tokens } }
    pairings: [],
    lastPairingTime: new Date()
  };
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

module.exports = {
  loadData,
  saveData
};
