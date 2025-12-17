const { handleJoin, handleLeave, handleStatus } = require('./handlers');

function registerCommands(app, data) {
  app.command('/CappucciBot', async ({ command, ack, respond, client }) => {
    await ack();
    
    const action = command.text.trim().toLowerCase();
    const userId = command.user_id;
    
    if (action === 'join') {
      await handleJoin(userId, client, respond, data);
    } else if (action === 'leave') {
      await handleLeave(userId, respond, data);
    } else if (action === 'status') {
      await handleStatus(respond, data);
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
}

module.exports = {
  registerCommands
};
