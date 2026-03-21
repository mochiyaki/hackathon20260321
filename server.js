const express = require('express');
const { addMemory, uploadFile, listMemories, searchMemories } = require('./lib/hyperspell');
const { getTrendingNews, fetchAllNews } = require('./lib/news-fetcher');
const { transformToGossip } = require('./lib/gossip-transformer');
const { FeedPusher } = require('./lib/feed-pusher');

const app = express();
app.use(express.json());
app.use(express.static('public'));

// Feed pusher instance
const feedPusher = new FeedPusher({
  outputs: ['console', 'file'],
  feedFile: './memory/the-friend-feed.json'
});

// ========== HYPERSPELL ENDPOINTS ==========

// Health check
app.get('/', (req, res) => {
  res.json({ 
    message: '☕ The Friend is here!', 
    agent: 'The Friend',
    status: 'online'
  });
});

// Add web data as memory
app.post('/api/memories/add', async (req, res) => {
  try {
    const { userId, text, title, collection, metadata } = req.body;
    
    if (!userId || !text) {
      return res.status(400).json({ error: 'userId and text are required' });
    }

    const result = await addMemory({
      userId,
      text,
      title: title || 'Web Data',
      collection: collection || 'web_data',
      metadata: metadata || { source: 'api', timestamp: new Date().toISOString() }
    });

    res.json({ success: true, result });
  } catch (error) {
    console.error('Error adding memory:', error);
    res.status(500).json({ error: error.message });
  }
});

// List memories
app.get('/api/memories/list', async (req, res) => {
  try {
    const { userId, collection, source, size } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const memories = await listMemories({
      userId,
      collection,
      source,
      size: size ? parseInt(size) : 50
    });

    res.json({ success: true, count: memories.length, memories });
  } catch (error) {
    console.error('Error listing memories:', error);
    res.status(500).json({ error: error.message });
  }
});

// Search memories
app.post('/api/memories/search', async (req, res) => {
  try {
    const { userId, query, answer } = req.body;
    
    if (!userId || !query) {
      return res.status(400).json({ error: 'userId and query are required' });
    }

    const result = await searchMemories(userId, query, { answer: answer || false });

    res.json({ 
      success: true, 
      query,
      answer: result.answer,
      documents: result.documents
    });
  } catch (error) {
    console.error('Error searching memories:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== THE FRIEND - NEWS/GOSSIP ENDPOINTS ==========

// Get trending news (raw)
app.get('/api/news/trending', async (req, res) => {
  try {
    const news = await getTrendingNews();
    res.json({ 
      success: true, 
      count: news.length,
      news 
    });
  } catch (error) {
    console.error('Error fetching news:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get gossip version of trending news
app.get('/api/gossip/trending', async (req, res) => {
  try {
    const news = await getTrendingNews();
    const gossip = news.map(item => ({
      original: item,
      gossip: transformToGossip(item)
    }));
    
    res.json({ 
      success: true, 
      count: gossip.length,
      gossip 
    });
  } catch (error) {
    console.error('Error generating gossip:', error);
    res.status(500).json({ error: error.message });
  }
});

// Transform a specific headline to gossip
app.post('/api/gossip/transform', async (req, res) => {
  try {
    const { headline, description, source } = req.body;
    
    if (!headline) {
      return res.status(400).json({ error: 'headline is required' });
    }

    const gossip = transformToGossip({
      title: headline,
      description: description || '',
      source: source || 'unknown',
      link: req.body.link || '',
      pubDate: new Date()
    });
    
    res.json({ 
      success: true,
      original: { headline, description, source },
      gossip 
    });
  } catch (error) {
    console.error('Error transforming:', error);
    res.status(500).json({ error: error.message });
  }
});

// The Friend posts gossip to feed
app.post('/api/friend/share', async (req, res) => {
  try {
    const { gossip, originalNews, autoGenerate } = req.body;
    
    let finalGossip = gossip;
    let original = originalNews;
    
    // Auto-generate from news if not provided
    if (autoGenerate || (!gossip && !originalNews)) {
      const news = await getTrendingNews();
      if (news.length === 0) {
        return res.status(404).json({ error: 'No news found to share' });
      }
      original = news[0];
      finalGossip = transformToGossip(original);
    }
    
    // Push to feed
    const entry = await feedPusher.push(finalGossip, original);
    
    res.json({ 
      success: true,
      message: '☕ The Friend shared some tea!',
      entry 
    });
  } catch (error) {
    console.error('Error sharing:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get The Friend's feed history
app.get('/api/friend/feed', (req, res) => {
  try {
    const count = parseInt(req.query.count) || 10;
    const feed = feedPusher.getRecentFeed(count);
    
    res.json({ 
      success: true,
      count: feed.length,
      feed 
    });
  } catch (error) {
    console.error('Error getting feed:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== START SERVER ==========

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('');
  console.log('☕'.repeat(25));
  console.log('  THE FRIEND IS ONLINE');
  console.log('☕'.repeat(25));
  console.log(`  Server: http://localhost:${PORT}`);
  console.log('');
  console.log('  Endpoints:');
  console.log('  ├─ GET  /                    Health check');
  console.log('  ├─ GET  /api/news/trending   Get trending news');
  console.log('  ├─ GET  /api/gossip/trending Get trending gossip');
  console.log('  ├─ POST /api/gossip/transform Transform headline → gossip');
  console.log('  ├─ POST /api/friend/share    The Friend shares gossip');
  console.log('  ├─ GET  /api/friend/feed     View The Friend\'s feed');
  console.log('  ├─ POST /api/memories/add    Save to Hyperspell');
  console.log('  └─ POST /api/memories/search Search memories');
  console.log('');
  console.log('  Try: curl http://localhost:' + PORT + '/api/gossip/trending');
  console.log('☕'.repeat(25));
  console.log('');
});
