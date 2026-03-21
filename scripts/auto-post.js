#!/usr/bin/env node
// Auto-post script - The Friend checks for news and shares ☕
// This runs on a schedule (cron)

const { getTrendingNews } = require('../lib/news-fetcher');
const { transformToGossip } = require('../lib/gossip-transformer');
const { FeedPusher } = require('../lib/feed-pusher');
const fs = require('fs');
const path = require('path');

// State file to track what we've already posted
const STATE_FILE = path.join(__dirname, '../memory/posted-news.json');

function loadPostedNews() {
  if (fs.existsSync(STATE_FILE)) {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  }
  return [];
}

function savePostedNews(posted) {
  const dir = path.dirname(STATE_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(STATE_FILE, JSON.stringify(posted, null, 2));
}

function isAlreadyPosted(newsItem, postedIds) {
  // Check by title (first 50 chars) + source
  const key = `${newsItem.title.slice(0, 50)}|${newsItem.source}`;
  return postedIds.includes(key);
}

async function main() {
  console.log('☕ The Friend is checking for fresh gossip...\n');
  
  const postedNews = loadPostedNews();
  const feedPusher = new FeedPusher({
    outputs: ['console', 'file'],
    feedFile: './memory/the-friend-feed.json'
  });
  
  try {
    // Get trending news
    const news = await getTrendingNews();
    
    if (news.length === 0) {
      console.log('No news found. The Friend will check again later.');
      return;
    }
    
    // Find new stories we haven't posted
    const newStories = [];
    for (const item of news) {
      if (!isAlreadyPosted(item, postedNews)) {
        newStories.push(item);
      }
    }
    
    if (newStories.length === 0) {
      console.log('No new stories. The Friend already shared the latest!');
      return;
    }
    
    console.log(`Found ${newStories.length} new stories to share!\n`);
    
    // Pick the top story (most trending)
    const topStory = newStories[0];
    const gossip = transformToGossip(topStory);
    
    // Post it
    const entry = await feedPusher.push(gossip, topStory);
    
    // Mark as posted
    const key = `${topStory.title.slice(0, 50)}|${topStory.source}`;
    postedNews.push(key);
    
    // Keep only last 100 posted items
    if (postedNews.length > 100) {
      postedNews.shift();
    }
    
    savePostedNews(postedNews);
    
    console.log('✅ Posted successfully!');
    console.log(`Total posted: ${postedNews.length} stories`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };
