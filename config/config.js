module.exports = {
  port: process.env.PORT || 3000,
  pairingIntervalMinutes: parseInt(process.env.PAIRING_INTERVAL_MINUTES) || 30,
  conversationStarters: [
    'What\'s something outside work you\'re passionate about?',
    'What\'s a skill you\'d like to learn?',
    'If you could have lunch with anyone, who would it be?',
    'What\'s your favorite thing about working here?',
    'What\'s a hobby you\'ve picked up recently?',
    'What\'s the best advice someone has given you?',
    'What are you looking forward to this month?',
    'What book or podcast has influenced you recently?',
    'What\'s your favorite way to spend a weekend?',
    'What\'s something new you tried this year?'
  ]
};
