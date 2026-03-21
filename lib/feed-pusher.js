// Feed Pusher - Deliver gossip to various outputs
// The Friend's delivery system ☕

const fs = require('fs');
const path = require('path');

class FeedPusher {
  constructor(options = {}) {
    this.outputs = options.outputs || ['console'];
    this.webhookUrl = options.webhookUrl;
    this.feedFile = options.feedFile || path.join(__dirname, '../memory/feed.json');
    this.maxHistory = options.maxHistory || 100;
    
    // Ensure memory directory exists
    const memoryDir = path.dirname(this.feedFile);
    if (!fs.existsSync(memoryDir)) {
      fs.mkdirSync(memoryDir, { recursive: true });
    }
  }
  
  // Main push method
  async push(gossip, originalNews = null) {
    const timestamp = new Date().toISOString();
    const entry = {
      id: this.generateId(),
      timestamp,
      gossip,
      originalNews,
      delivered: []
    };
    
    // Push to all configured outputs
    for (const output of this.outputs) {
      try {
        switch (output) {
          case 'console':
            await this.pushToConsole(entry);
            break;
          case 'file':
            await this.pushToFile(entry);
            break;
          case 'webhook':
            await this.pushToWebhook(entry);
            break;
          case 'hyperspell':
            await this.pushToHyperspell(entry);
            break;
        }
        entry.delivered.push(output);
      } catch (error) {
        console.error(`Failed to push to ${output}:`, error.message);
      }
    }
    
    return entry;
  }
  
  // Output: Console (for testing/demo)
  async pushToConsole(entry) {
    console.log('\n' + '='.repeat(50));
    console.log('☕ The Friend says:');
    console.log('='.repeat(50));
    console.log(entry.gossip);
    console.log('='.repeat(50));
    console.log(`Posted: ${new Date(entry.timestamp).toLocaleString()}`);
    if (entry.originalNews?.link) {
      console.log(`Source: ${entry.originalNews.link}`);
    }
    console.log('');
  }
  
  // Output: Local JSON file (feed history)
  async pushToFile(entry) {
    let feed = [];
    
    // Read existing feed
    if (fs.existsSync(this.feedFile)) {
      try {
        const data = fs.readFileSync(this.feedFile, 'utf8');
        feed = JSON.parse(data);
      } catch (error) {
        console.error('Error reading feed file:', error.message);
      }
    }
    
    // Add new entry
    feed.unshift(entry);
    
    // Trim to max history
    if (feed.length > this.maxHistory) {
      feed = feed.slice(0, this.maxHistory);
    }
    
    // Write back
    fs.writeFileSync(this.feedFile, JSON.stringify(feed, null, 2));
    console.log(`✅ Saved to feed (${feed.length} entries)`);
  }
  
  // Output: Webhook (Discord, Slack, etc.)
  async pushToWebhook(entry) {
    if (!this.webhookUrl) {
      console.warn('No webhook URL configured');
      return;
    }
    
    // Format for Discord
    const payload = {
      content: entry.gossip,
      embeds: entry.originalNews ? [{
        title: entry.originalNews.title,
        url: entry.originalNews.link,
        description: entry.originalNews.description?.slice(0, 200) + '...',
        timestamp: entry.timestamp,
        footer: { text: `☕ The Friend | Source: ${entry.originalNews.source}` }
      }] : undefined
    };
    
    const response = await fetch(this.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      throw new Error(`Webhook failed: ${response.status}`);
    }
    
    console.log('✅ Posted to webhook');
  }
  
  // Output: Hyperspell (store for future reference)
  async pushToHyperspell(entry) {
    // This would require the Hyperspell SDK
    // For now, just log it
    console.log('🧠 Would save to Hyperspell memory');
    // const { addMemory } = require('./hyperspell');
    // await addMemory({
    //   userId: 'the-friend',
    //   text: entry.gossip,
    //   title: `News: ${entry.originalNews?.title}`,
    //   collection: 'the-friend-feed',
    //   metadata: {
    //     timestamp: entry.timestamp,
    //     source: entry.originalNews?.source,
    //     link: entry.originalNews?.link
    //   }
    // });
  }
  
  // Generate unique ID
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
  
  // Get recent feed
  getRecentFeed(count = 10) {
    if (!fs.existsSync(this.feedFile)) {
      return [];
    }
    
    try {
      const data = fs.readFileSync(this.feedFile, 'utf8');
      const feed = JSON.parse(data);
      return feed.slice(0, count);
    } catch (error) {
      console.error('Error reading feed:', error.message);
      return [];
    }
  }
}

module.exports = { FeedPusher };
