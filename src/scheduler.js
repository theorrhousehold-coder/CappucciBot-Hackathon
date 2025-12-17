const { saveData } = require('./dataManager');
const config = require('../config/config');

async function sendPairingDM(app, userId1, userId2, location) {
  try {
    const conversationStarters = [
      'What\'s something outside work you\'re passionate about?',
      'What\'s a skill you\'d like to learn?',
      'If you could have lunch with anyone, who would it be?',
      'What\'s your favorite thing about working here?',
      'What\'s a hobby you\'ve picked up recently?',
      'What\'s the best advice someone has given you?',
      'What are you looking forward to this month?'
    ];
    
    const starter = conversationStarters[Math.floor(Math.random() * conversationStarters.length)];
    
    const message = 
      `🎉 You've been matched for coffee!\n\n` +
      `Location: *${location}*\n` +
      `Time: Anytime in the next 2 hours\n\n` +
      `Conversation starter:\n_"${starter}"_\n\n` +
      `React with ✅ once you meet!`;
    
    // Send to both users
    await app.client.chat.postMessage({
      channel: userId1,
      text: message
    });
    
    await app.client.chat.postMessage({
      channel: userId2,
      text: message
    });
    
    console.log(`✅ Paired ${userId1} & ${userId2} in ${location}`);
  } catch (error) {
    console.error('Error sending pairing DM:', error);
  }
}

async function executePairingRound(app, data) {
  console.log('📍 Checking all location queues for pairing...');
  
  for (let location in data.queues) {
    const queue = data.queues[location];
    
    if (queue.length < 2) {
      console.log(`⚠️ ${location}: Not enough people to pair (${queue.length})`);
      continue;
    }
    
    // Increment rounds in queue for all users
    queue.forEach(user => user.roundsInQueue++);
    
    // Get people who should be paired (been waiting 1-2 rounds)
    const toPair = queue.filter(u => u.roundsInQueue <= 2).slice(0, Math.floor(queue.length / 2) * 2);
    
    if (toPair.length < 2) {
      console.log(`⚠️ ${location}: Not enough people in eligible rounds (${toPair.length})`);
      continue;
    }
    
    // Random shuffle
    const shuffled = toPair.sort(() => Math.random() - 0.5);
    
    // Create pairs
    for (let i = 0; i < shuffled.length; i += 2) {
      const user1 = shuffled[i];
      const user2 = shuffled[i + 1];
      
      // Send DMs to both users
      await sendPairingDM(app, user1.userId, user2.userId, location);
      
      // Remove from queue
      const idx1 = queue.indexOf(user1);
      const idx2 = queue.indexOf(user2);
      if (idx1 > -1) queue.splice(idx1, 1);
      if (idx2 > -1) queue.splice(idx2, 1);
      
      // Store pairing
      data.pairings.push({
        user1: user1.userId,
        user2: user2.userId,
        location,
        pairedAt: new Date()
      });
    }
  }
  
  saveData(data);
}

function schedulePairingRounds(app, data) {
  const intervalMs = config.pairingIntervalMinutes * 60 * 1000;
  setInterval(() => {
    console.log('🔔 Pairing round triggered!');
    executePairingRound(app, data);
  }, intervalMs);
  
  console.log(`⏰ Pairing rounds scheduled every ${config.pairingIntervalMinutes} minutes`);
}

module.exports = {
  schedulePairingRounds
};
