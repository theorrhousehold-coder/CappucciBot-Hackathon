const { App } = require('@slack/bolt');
const fs = require('fs');
require('dotenv').config();

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
});

// Data storage (local file)
const DATA_FILE = './data.json';

function loadData() {
  if (fs.existsSync(DATA_FILE)) {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  }
  return {
    queues: {}, // { "location": [{ userId, joinedAt, roundsInQueue }] }
    users:  {}, // { userId: { name, location, tokens } }
    pairings: [],
    lastPairingTime: new Date()
  };
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

let data = loadData();

// ============= COMMANDS =============

app.command('/CappucciBot', async ({ command, ack, respond, client }) => {
  await ack();
  
  const action = command. text.trim().toLowerCase();
  const userId = command.user_id;
  
  if (action === 'join') {
    await handleJoin(userId, client, respond);
  } else if (action === 'leave') {
    await handleLeave(userId, respond);
  } else if (action === 'status') {
    await handleStatus(respond);
  } else {
    await respond(
      '❓ Unknown command.\n\n' +
      'Usage:\n' +
      '`/CappucciBot join` - Join the coffee queue\n' +
      '`/CappucciBot leave` - Leave the coffee queue\n' +
      '`/CappucciBot status` - Check queue status'
    );
  }
});

// ============= HANDLERS =============

async function handleJoin(userId, client, respond) {
  try {
    // Get user's location from Slack profile
    const userInfo = await client.users.info({ user: userId });
    const location = userInfo.user.profile.location || 'Unknown Location';
    const userName = userInfo.user.real_name || userInfo.user. name;
    
    // Initialize location queue if needed
    if (!data.queues[location]) {
      data.queues[location] = [];
    }
    
    // Check if user already in queue
    const alreadyInQueue = data.queues[location].some(u => u.userId === userId);
    if (alreadyInQueue) {
      await respond('You\'re already in the queue for *' + location + '*!');
      return;
    }
    
    // Add to queue
    data.queues[location].push({
      userId,
      userName,
      joinedAt: new Date(),
      roundsInQueue: 0
    });
    
    // Store user info
    data.users[userId] = { name: userName, location };
    saveData(data);
    
    const queueSize = data.queues[location]. length;
    const nextRound = getTimeUntilNextRound();
    
    await respond(
      `☕ You've joined the *${location}* queue!\n` +
      `Queue size: *${queueSize}* people\n` +
      `Next pairing round:  in *${nextRound}*\n\n` +
      `React with ❌ to leave queue`
    );
  } catch (error) {
    console.error('Error in handleJoin:', error);
    await respond('Error:  Could not read your location from Slack profile.  Please set your "Primary Location" in your profile settings.');
  }
}

async function handleLeave(userId, respond) {
  let found = false;
  
  for (let location in data.queues) {
    const initialLength = data.queues[location]. length;
    data.queues[location] = data.queues[location].filter(u => u.userId !== userId);
    
    if (data. queues[location].length < initialLength) {
      found = true;
    }
    
    if (data.queues[location].length === 0) {
      delete data.queues[location];
    }
  }
  
  saveData(data);
  
  if (found) {
    await respond('You\'ve left the queue!  ☕');
  } else {
    await respond('You\'re not in any queue.');
  }
}

async function handleStatus(respond) {
  let status = '📊 *Coffee Queue Status*\n\n';
  
  if (Object.keys(data.queues).length === 0) {
    status += 'No one in queue right now. Be the first!  `/CappucciBot join`';
  } else {
    for (let location in data.queues) {
      const queueSize = data.queues[location]. length;
      status += `🏙️ *${location}*:  ${queueSize} people\n`;
    }
  }
  
  const nextRound = getTimeUntilNextRound();
  status += `\nNext pairing round: in *${nextRound}*`;
  
  await respond(status);
}

// ============= UTILITIES =============

function getTimeUntilNextRound() {
  const now = new Date();
  const nextRound = new Date(now);
  nextRound.setMinutes(Math.ceil(now.getMinutes() / 30) * 30, 0, 0);
  
  if (nextRound <= now) {
    nextRound.setMinutes(nextRound.getMinutes() + 30);
  }
  
  const diffMs = nextRound - now;
  const diffMins = Math.floor(diffMs / 60000);
  
  return `${diffMins} minute${diffMins !== 1 ? 's' : ''}`;
}

// ============= SCHEDULER (every 30 minutes) =============

function schedulePairingRounds() {
  setInterval(() => {
    console.log('🔔 Pairing round triggered!');
    executePairingRound();
  }, 30 * 60 * 1000); // 30 minutes
}

async function executePairingRound() {
  console.log('📍 Checking all location queues for pairing...');
  
  for (let location in data.queues) {
    const queue = data.queues[location];
    
    if (queue.length < 2) {
      console.log(`⚠️ ${location}:  Not enough people to pair (${queue.length})`);
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
      await sendPairingDM(user1.userId, user2.userId, location);
      
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

async function sendPairingDM(userId1, userId2, location) {
  try {
    const conversationStarters = [
      'What\'s something outside work you\'re passionate about?',
      'What\'s a skill you\'d like to learn?',
      'If you could have lunch with anyone, who would it be? ',
      'What\'s your favorite thing about working here?',
      'What\'s a hobby you\'ve picked up recently?',
      'What\'s the best advice someone has given you?',
      'What are you looking forward to this month?'
    ];
    
    const starter = conversationStarters[Math. floor(Math.random() * conversationStarters.length)];
    
    const message = 
      `🎉 You've been matched for coffee!\n\n` +
      `Location: *${location}*\n` +
      `Time:  Anytime in the next 2 hours\n\n` +
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

// ============= START =============

(async () => {
  await app.start(process.env.PORT || 3000);
  console.log('⚡️ CappucciBot is running!');
  console.log(`🚀 Listening on port ${process.env.PORT || 3000}`);
  
  // Start pairing scheduler
  schedulePairingRounds();
  console.log('📅 Pairing scheduler started (every 30 minutes)');
})();