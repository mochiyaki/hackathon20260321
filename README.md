# The Friend ☕

An OpenClaw agent that transforms breaking news into casual gossip - like your friend who always knows what's happening and can't wait to tell you about it.

## What It Does

The Friend monitors news sources, picks the hottest stories, and rewrites them in a casual, chatty format. Instead of "Federal Reserve raises interest rates by 0.25%", you get "omg btw the fed just raised rates again 💀 rip to anyone trying to buy a house".

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        THE FRIEND                            │
│                    News → Gossip Agent                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
        ┌──────────────────────────────────────────┐
        │         Express.js Server (3000)         │
        │  REST API + Static Feed Viewer           │
        └──────────────────────────────────────────┘
                 │                 │
        ┌────────┴────────┐       └──────────────┐
        │                 │                      │
        ▼                 ▼                      ▼
  ┌──────────┐    ┌─────────────┐      ┌────────────┐
  │   News   │    │   Gossip    │      │   Feed     │
  │ Fetcher  │    │ Transformer │      │  Pusher    │
  └──────────┘    └─────────────┘      └────────────┘
        │                 │                      │
        ▼                 ▼                      ▼
  RSS Feeds      Pattern-Based          File + Console
  (BBC, CNN,     Casualization          + Hyperspell
  TechCrunch,    + Context Rules        Memory Store
  Reddit, etc.)
                              │
                              ▼
                    ┌──────────────────┐
                    │  Auto-Poster     │
                    │  (Cron Schedule) │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Memory State    │
                    │  posted-news.json│
                    │  the-friend-feed │
                    └──────────────────┘
```

## Project Structure

```
hackathon0321/
├── lib/                        # Core modules
│   ├── news-fetcher.js        # Fetch from RSS feeds
│   ├── gossip-transformer.js  # Transform news → gossip
│   ├── feed-pusher.js         # Push to feed outputs
│   └── hyperspell.js          # Memory management
│
├── scripts/                   # Automation
│   └── auto-post.js          # Scheduled news posting
│
├── memory/                    # State persistence
│   ├── posted-news.json      # Deduplication tracking
│   └── the-friend-feed.json  # Feed history
│
├── public/                    # Frontend
│   └── feed.html             # Web feed viewer
│
├── server.js                 # Express API server
├── local-cron.js            # Local scheduler (60s interval)
├── test-gossip.js           # Test transformer
│
├── .env                      # Configuration
├── package.json              # Dependencies
│
└── Documentation/
    ├── AGENTS.md             # Agent overview
    ├── IDENTITY.md           # Voice & personality
    ├── SOUL.md              # Format rules & examples
    ├── TOOLS.md             # Environment setup notes
    ├── BOOTSTRAP.md         # Initial setup guide
    ├── HEARTBEAT.md         # Health checks
    └── USER.md              # User preferences
```

## Workflow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. FETCH                                                     │
│    News Fetcher pulls from RSS feeds (BBC, CNN, Reddit...)  │
│    → Parses XML → Deduplicates → Ranks by trending score   │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. TRANSFORM                                                 │
│    Gossip Transformer converts formal news to casual chat   │
│    → Adds openers ("omg", "btw")                           │
│    → Casualizes language ("announced" → "said")            │
│    → Adds reactions ("wild right?", "💀")                  │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. DEDUPLICATE                                               │
│    Check against posted-news.json                           │
│    → Skip if already shared → Continue if new              │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. PUBLISH                                                   │
│    Feed Pusher outputs gossip                               │
│    → Console log                                            │
│    → File (the-friend-feed.json)                           │
│    → Hyperspell memory (optional)                          │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. SERVE                                                     │
│    Express serves via API + web interface                   │
│    → GET /api/friend/feed → View history                   │
│    → GET /feed.html → Pretty web viewer                    │
└─────────────────────────────────────────────────────────────┘
```

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
cp env.example .env
```

Edit `.env` and add your Hyperspell API key (optional):
```
HYPERSPELL_API_KEY=hs2-0-xxxxxxxxxxxxxxxxxxxxxx
```

### 3. Run the Server

```bash
npm start
```

Server starts at `http://localhost:3000`

### 4. View the Feed

Open `http://localhost:3000/feed.html` in your browser

## Usage

### Manual Mode (Test & Explore)

```bash
# Test the gossip transformer
npm test

# Start the API server
npm start

# Try these endpoints:
curl http://localhost:3000/api/gossip/trending
curl http://localhost:3000/api/friend/feed
```

### Auto-Posting Mode (Production)

Run the local scheduler to check for news every 60 seconds:

```bash
node local-cron.js
```

This will:
- Check RSS feeds every minute
- Transform top trending story
- Post if new (skip if already shared)
- Save to feed and memory

## API Reference

### News Endpoints

#### `GET /api/news/trending`
Get raw trending news (unprocessed)

**Response:**
```json
{
  "success": true,
  "count": 5,
  "news": [
    {
      "title": "...",
      "description": "...",
      "source": "bbc",
      "link": "...",
      "pubDate": "2026-03-22T...",
      "score": 0.85
    }
  ]
}
```

#### `GET /api/gossip/trending`
Get trending news transformed to gossip

**Response:**
```json
{
  "success": true,
  "count": 5,
  "gossip": [
    {
      "original": { /* news item */ },
      "gossip": "omg so apparently..."
    }
  ]
}
```

### The Friend Endpoints

#### `POST /api/friend/share`
The Friend posts gossip to the feed

**Request:**
```json
{
  "autoGenerate": true  // Fetch & post latest trending
}
```

Or provide custom content:
```json
{
  "gossip": "your gossip text here",
  "originalNews": { /* news object */ }
}
```

**Response:**
```json
{
  "success": true,
  "message": "☕ The Friend shared some tea!",
  "entry": {
    "id": "...",
    "gossip": "...",
    "timestamp": "..."
  }
}
```

#### `GET /api/friend/feed?count=10`
Get The Friend's recent posts

**Response:**
```json
{
  "success": true,
  "count": 10,
  "feed": [
    {
      "id": "...",
      "gossip": "omg btw...",
      "original": { /* news source */ },
      "timestamp": "2026-03-22T..."
    }
  ]
}
```

### Transform Endpoint

#### `POST /api/gossip/transform`
Transform any headline to gossip format

**Request:**
```json
{
  "headline": "Federal Reserve raises interest rates",
  "description": "The Fed increased rates by 0.25%...",
  "source": "Reuters"
}
```

**Response:**
```json
{
  "success": true,
  "original": { /* input */ },
  "gossip": "omg btw the fed just raised rates again..."
}
```

### Memory Endpoints (Hyperspell)

#### `POST /api/memories/add`
Save data to Hyperspell memory

#### `GET /api/memories/list`
List stored memories

#### `POST /api/memories/search`
Search memories by query

## Configuration

### News Sources

Edit `lib/news-fetcher.js` to add/remove RSS feeds:

```javascript
const RSS_FEEDS = [
  'https://feeds.bbci.co.uk/news/world/rss.xml',
  'https://techcrunch.com/feed/',
  // Add more...
];
```

### Gossip Style

Edit `lib/gossip-transformer.js` to customize:

```javascript
this.openers = ["omg", "btw", "you won't believe this"];
this.reactions = ["wild right?", "crazy times", "👀"];
```

### Posting Frequency

Edit `local-cron.js` to change schedule:

```javascript
setInterval(runAutoPost, 60000); // 60 seconds
```

## The Friend's Personality

Read the documentation files to understand The Friend's voice:

- **IDENTITY.md** - Name, creature, vibe, emoji
- **SOUL.md** - Format rules, examples, boundaries
- **AGENTS.md** - Mission and tools

Key principles:
- Always casual, never formal
- "omg" not "Breaking:"
- "btw" not "According to sources"
- Keep it light but respectful
- Verify before gossiping

## Example Transformations

| Original News | The Friend's Version |
|--------------|---------------------|
| "Federal Reserve raises interest rates by 0.25%" | "omg btw the fed just raised rates again 💀 rip to anyone trying to buy a house" |
| "Tech company announces layoffs affecting 10% of workforce" | "so apparently [company] just laid off like 10% of people?? rough out there" |
| "New climate report shows concerning trends" | "did you see that new climate report?? apparently things are heating up faster than expected 👀" |

## Development

### Run Tests

```bash
npm test
```

### Development Mode

```bash
npm run dev
```

### Project Demo

```bash
npm run demo
```

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js 5.x
- **Memory:** Hyperspell API
- **News Sources:** RSS feeds (BBC, CNN, TechCrunch, Reddit)
- **Parsing:** Custom RSS parser
- **State:** JSON file storage
- **Frontend:** Vanilla HTML/CSS/JS

## Memory Files

### `memory/posted-news.json`
Tracks posted stories to prevent duplicates
```json
[
  "Federal Reserve raises interest rates|reuters",
  "Tech company announces layoffs|techcrunch"
]
```

### `memory/the-friend-feed.json`
Complete feed history
```json
[
  {
    "id": "1234567890",
    "gossip": "omg so apparently...",
    "original": { /* news object */ },
    "timestamp": "2026-03-22T10:30:00Z"
  }
]
```

## Deployment

### Local (Development)
```bash
npm start
node local-cron.js  # In separate terminal for auto-posting
```

### Production
- Deploy to any Node.js hosting (Heroku, Railway, Render, etc.)
- Set environment variables
- Use proper cron service for scheduling (node-cron, system cron, etc.)
- Consider rate limits on RSS feeds
- Monitor memory file sizes

## Rate Limits & Best Practices

- Be nice to RSS feeds: 500ms delay between requests
- Track only last 100 posted items (auto-prune)
- Default: check every 60 seconds, post max 1 story
- Skip duplicate content automatically
- Respect source attributions

## License

ISC

## Contributing

This is a hackathon project. Feel free to fork and customize for your own "Friend" personality!

---

**Built for Hackathon 2026.03.21**

The Friend is always online, always caffeinated, always ready to gossip ☕
