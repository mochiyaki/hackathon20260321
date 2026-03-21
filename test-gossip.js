#!/usr/bin/env node
// Test script for The Friend ☕
// Run with: npm test

const { transformToGossip } = require('./lib/gossip-transformer');

// Test headlines
const testHeadlines = [
  {
    title: "Federal Reserve Raises Interest Rates by 0.25 Percentage Points",
    description: "The Federal Reserve announced Wednesday that it is raising its benchmark interest rate by 0.25 percentage points to combat inflation.",
    source: "reuters",
    link: "https://example.com/news/1"
  },
  {
    title: "Tech Giant Announces 10,000 Layoffs Amid Economic Uncertainty",
    description: "The company cited challenging economic conditions as it moves to streamline operations and reduce costs.",
    source: "techcrunch",
    link: "https://example.com/news/2"
  },
  {
    title: "Scientists Discover New Species of Deep-Sea Creature",
    description: "Researchers found a previously unknown bioluminescent species during an expedition to the Pacific Ocean.",
    source: "bbc",
    link: "https://example.com/news/3"
  },
  {
    title: "Popular Streaming Service Raises Prices for Third Time This Year",
    description: "Subscribers will see their monthly fees increase starting next month, the company announced.",
    source: "verge",
    link: "https://example.com/news/4"
  },
  {
    title: "SpaceX Successfully Launches New Satellite Constellation",
    description: "The Falcon 9 rocket carried 60 Starlink satellites into orbit in the company's latest mission.",
    source: "cnn",
    link: "https://example.com/news/5"
  }
];

console.log('☕'.repeat(50));
console.log('  THE FRIEND - GOSSIP TEST');
console.log('☕'.repeat(50));
console.log('');

let passed = 0;
let failed = 0;

testHeadlines.forEach((news, i) => {
  console.log(`Test ${i + 1}: "${news.title.slice(0, 50)}..."`);
  console.log('-'.repeat(50));
  
  try {
    const gossip = transformToGossip(news);
    
    // Validation checks
    const hasOpener = /^(omg|btw|you won|so apparently|did you hear|okay so|plot twist|wait so)/i.test(gossip);
    const notFormal = !/^according to|^sources say|^in a statement/i.test(gossip);
    const hasVibe = gossip.includes('?') || gossip.includes('!') || gossip.includes('👀') || gossip.includes('💀');
    
    if (hasOpener && notFormal) {
      console.log('✅ PASS - Sounds like a friend');
      passed++;
    } else {
      console.log('⚠️  WARNING - Might be too formal');
      if (!hasOpener) console.log('   - Missing casual opener');
      if (!notFormal) console.log('   - Sounds like news, not gossip');
    }
    
    console.log('');
    console.log('  Original:', news.title.slice(0, 60) + '...');
    console.log('');
    console.log('  Gossip:', gossip);
    console.log('');
    
  } catch (error) {
    console.log('❌ FAIL - Error:', error.message);
    failed++;
  }
  
  console.log('');
});

console.log('☕'.repeat(50));
console.log(`  Results: ${passed}/${testHeadlines.length} passed`);
console.log('☕'.repeat(50));

process.exit(failed > 0 ? 1 : 0);
