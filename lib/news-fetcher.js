// News Fetcher for The Friend
// Fetches breaking/trending news from various sources

const RSS_FEEDS = [
  // World News
  'https://feeds.bbci.co.uk/news/world/rss.xml',
  'https://feeds.reuters.com/reuters/topNews',
  'https://rss.cnn.com/rss/edition.rss',
  // Tech
  'https://techcrunch.com/feed/',
  'https://www.theverge.com/rss/index.xml',
  // Reddit (via RSS)
  'https://www.reddit.com/r/news/.rss',
  'https://www.reddit.com/r/worldnews/.rss',
  'https://www.reddit.com/r/technology/.rss',
];

// Alternative: Use NewsAPI (free tier: 100 requests/day)
// https://newsapi.org/docs/get-started

async function fetchRSSFeed(url) {
  try {
    const response = await fetch(url);
    const xml = await response.text();
    const items = parseRSS(xml);
    return items.slice(0, 5); // Top 5 from each feed
  } catch (error) {
    console.error(`Error fetching ${url}:`, error.message);
    return [];
  }
}

function parseRSS(xml) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  const titleRegex = /<title>(.*?)<\/title>/;
  const linkRegex = /<link>(.*?)<\/link>/;
  const descRegex = /<description>(.*?)<\/description>/;
  const pubDateRegex = /<pubDate>(.*?)<\/pubDate>/;
  
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];
    const title = (itemXml.match(titleRegex) || [,''])[1];
    const link = (itemXml.match(linkRegex) || [,''])[1];
    const description = (itemXml.match(descRegex) || [,''])[1];
    const pubDate = (itemXml.match(pubDateRegex) || [,''])[1];
    
    if (title) {
      items.push({
        title: cleanText(title),
        link: link.trim(),
        description: cleanText(description),
        pubDate: pubDate ? new Date(pubDate) : new Date(),
        source: extractSource(link)
      });
    }
  }
  
  return items;
}

function extractSource(url) {
  try {
    const domain = new URL(url).hostname.replace('www.', '');
    return domain.split('.')[0];
  } catch {
    return 'unknown';
  }
}

function cleanText(text) {
  if (!text) return '';
  return text
    .replace(/<!\[CDATA\[/g, '')
    .replace(/\]\]>/g, '')
    .replace(/<[^>]+>/g, '')
    .trim();
}

async function fetchAllNews() {
  console.log('☕ The Friend is checking what\'s happening...');
  
  const allNews = [];
  for (const feed of RSS_FEEDS) {
    const items = await fetchRSSFeed(feed);
    allNews.push(...items);
    await new Promise(r => setTimeout(r, 500)); // Be nice to servers
  }
  
  // Sort by date (newest first) and remove duplicates
  const seen = new Set();
  const unique = allNews
    .sort((a, b) => b.pubDate - a.pubDate)
    .filter(item => {
      const key = item.title.toLowerCase().slice(0, 50);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  
  return unique.slice(0, 10); // Top 10 stories
}

// Calculate trending score (simplified)
function calculateTrendingScore(item, allItems) {
  const hoursAgo = (Date.now() - item.pubDate) / (1000 * 60 * 60);
  const recency = Math.max(0, 24 - hoursAgo) / 24; // 0-1, higher is newer
  
  // Check for keywords that indicate importance
  const buzzWords = ['breaking', 'exclusive', 'urgent', 'just', 'announced', 'revealed'];
  const buzzScore = buzzWords.filter(w => 
    item.title.toLowerCase().includes(w)
  ).length / buzzWords.length;
  
  return recency * 0.7 + buzzScore * 0.3;
}

async function getTrendingNews() {
  const allNews = await fetchAllNews();
  return allNews
    .map(item => ({ ...item, score: calculateTrendingScore(item, allNews) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

module.exports = { fetchAllNews, getTrendingNews };
