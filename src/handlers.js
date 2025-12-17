const { saveData } = require('./dataManager');
const { getTimeUntilNextRound } = require('./utils');

async function handleJoin(userId, client, respond, data) {
  try {
    // Get user's location from Slack profile
    const userInfo = await client.users.info({ user: userId });
    const location = userInfo.user.profile.location || 'Unknown Location';
    const userName = userInfo.user.real_name || userInfo.user.name;
    
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
    
    const queueSize = data.queues[location].length;
    const nextRound = getTimeUntilNextRound();
    
    await respond(
      `☕ You've joined the *${location}* queue!\n` +
      `Queue size: *${queueSize}* people\n` +
      `Next pairing round: in *${nextRound}*\n\n` +
      `React with ❌ to leave queue`
    );
  } catch (error) {
    console.error('Error in handleJoin:', error);
    await respond('Error: Could not read your location from Slack profile. Please set your "Primary Location" in your profile settings.');
  }
}

async function handleLeave(userId, respond, data) {
  let found = false;
  
  for (let location in data.queues) {
    const initialLength = data.queues[location].length;
    data.queues[location] = data.queues[location].filter(u => u.userId !== userId);
    
    if (data.queues[location].length < initialLength) {
      found = true;
    }
    
    if (data.queues[location].length === 0) {
      delete data.queues[location];
    }
  }
  
  saveData(data);
  
  if (found) {
    await respond('You\'ve left the queue! ☕');
  } else {
    await respond('You\'re not in any queue.');
  }
}

async function handleStatus(respond, data) {
  let status = '📊 *Coffee Queue Status*\n\n';
  
  if (Object.keys(data.queues).length === 0) {
    status += 'No one in queue right now. Be the first! `/CappucciBot join`';
  } else {
    // Sort locations by queue size (largest first)
    const sortedLocations = Object.entries(data.queues)
      .sort((a, b) => b[1].length - a[1].length);
    
    for (const [location, queue] of sortedLocations) {
      const queueSize = queue.length;
      status += `🏙️ *${location}*: ${queueSize} people\n`;
    }
  }
  
  const nextRound = getTimeUntilNextRound();
  status += `\nNext pairing round: in *${nextRound}*`;
  
  await respond(status);
}

module.exports = {
  handleJoin,
  handleLeave,
  handleStatus
};
