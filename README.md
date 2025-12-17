# CappucciBot ☕

A Slack bot that automatically pairs people for coffee chats based on their location, fostering connection and networking within your organization.

## Features

- 🌍 **Location-based pairing** - Matches people in the same physical location
- ⏰ **Automatic scheduling** - Runs pairing rounds every 30 minutes
- 🎲 **Smart matching** - Ensures fair distribution with queue management
- 💬 **Conversation starters** - Provides icebreakers for each pairing
- 📊 **Queue status** - View current queue sizes by location

## Project Structure

```
cappucciBot/
├── src/
│   ├── server.js        # Main entry point
│   ├── commands.js      # Slack command registration
│   ├── handlers.js      # Command handlers (join/leave/status)
│   ├── scheduler.js     # Pairing round scheduler
│   ├── dataManager.js   # Data persistence layer
│   └── utils.js         # Utility functions
├── config/
│   └── config.js        # Configuration settings
├── data/
│   └── data.json        # User queue and pairing data (auto-generated)
├── .env                 # Environment variables (create from .env.example)
├── .env.example         # Environment variables template
├── .gitignore           # Git ignore rules
├── package.json         # Node.js dependencies
└── README.md            # This file
```

## Prerequisites

- Node.js (v14 or higher)
- A Slack workspace where you have admin permissions
- Slack App credentials (Bot Token and Signing Secret)

## Setup

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd cappucciBot
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Create Slack App

1. Go to [api.slack.com/apps](https://api.slack.com/apps)
2. Click **"Create New App"** → **"From scratch"**
3. Name it "CappucciBot" and select your workspace

#### Configure OAuth & Permissions:
Add these **Bot Token Scopes**:
- `chat:write` - Send messages
- `commands` - Register slash commands
- `users:read` - Read user profile information

#### Create Slash Command:
- Go to **Slash Commands** → **Create New Command**
- **Command**: `/CappucciBot`
- **Request URL**: `https://your-domain.com/slack/events`
- **Short Description**: "Join coffee queue or check status"
- **Usage Hint**: `join | leave | status`

#### Enable Event Subscriptions (Optional):
- **Request URL**: `https://your-domain.com/slack/events`

#### Install to Workspace:
- Go to **Install App** and click **"Install to Workspace"**
- Copy the **Bot User OAuth Token** (starts with `xoxb-`)
- Copy the **Signing Secret** from **Basic Information**

### 4. Configure Environment Variables

Create a `.env` file from the example:

```bash
cp .env.example .env
```

Edit `.env` and add your credentials:

```env
SLACK_BOT_TOKEN=xoxb-your-bot-token-here
SLACK_SIGNING_SECRET=your-signing-secret-here
PORT=3000
```

### 5. Run the Bot

```bash
npm start
```

You should see:
```
⚡️ CappucciBot is running!
🚀 Listening on port 3000
📅 Pairing scheduler started (every 30 minutes)
```

## Usage

### Commands

Users interact with CappucciBot using the `/CappucciBot` slash command:

#### Join the Queue
```
/CappucciBot join
```
Adds you to the coffee queue for your location (based on Slack profile).

#### Leave the Queue
```
/CappucciBot leave
```
Removes you from the coffee queue.

#### Check Status
```
/CappucciBot status
```
View current queue sizes by location and time until next pairing.

### How Pairing Works

1. **Users join** the queue using `/CappucciBot join`
2. Every **30 minutes**, the bot runs a pairing round
3. Users in the same location who have been waiting 1-2 rounds get paired
4. Both users receive a **DM with**:
   - Their match's information
   - Location
   - A conversation starter
   - 2-hour window to meet

### User Location Setup

**Important**: Users must set their **Primary Location** in their Slack profile:
1. Click your profile picture → **Profile**
2. Click **Edit Profile**
3. Add your location (e.g., "San Francisco", "New York Office")
4. Save changes

## Development

### Running in Development Mode

```bash
npm run dev
```

### Data Storage

User data is stored in `data/data.json` with the following structure:

```json
{
  "queues": {
    "Location Name": [
      {
        "userId": "U123456",
        "userName": "John Doe",
        "joinedAt": "2025-12-17T10:00:00.000Z",
        "roundsInQueue": 0
      }
    ]
  },
  "users": {
    "U123456": {
      "name": "John Doe",
      "location": "Location Name"
    }
  },
  "pairings": [
    {
      "user1": "U123456",
      "user2": "U789012",
      "location": "Location Name",
      "pairedAt": "2025-12-17T10:30:00.000Z"
    }
  ],
  "lastPairingTime": "2025-12-17T10:30:00.000Z"
}
```

## Deployment

### Heroku

```bash
heroku create your-cappuccibot
heroku config:set SLACK_BOT_TOKEN=your-token
heroku config:set SLACK_SIGNING_SECRET=your-secret
git push heroku main
```

### Other Platforms

Ensure your hosting platform:
- Supports Node.js
- Has a persistent filesystem for `data/data.json` (or switch to a database)
- Exposes a public URL for Slack to reach your bot

## Configuration

Edit `config/config.js` to customize:

- `pairingIntervalMinutes` - How often to run pairing rounds (default: 30)
- `conversationStarters` - Add or modify conversation starter prompts

## Troubleshooting

### "Could not read your location from Slack profile"
Users need to set their Primary Location in their Slack profile settings.

### Bot not responding to commands
- Verify your `SLACK_BOT_TOKEN` and `SLACK_SIGNING_SECRET` are correct
- Check that your Request URL in Slack app settings points to your bot
- Ensure the bot is running and accessible from the internet

### Pairing rounds not triggering
- Check server logs for errors
- Verify the scheduler is running (look for the startup message)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

ISC

## Support

For issues or questions, please open an issue on GitHub or contact your workspace admin.

---

Made with ☕ and ❤️
