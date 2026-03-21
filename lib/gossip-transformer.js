// Gossip Transformer - Turn news into friend-chat format
// This is The Friend's secret sauce ☕

class GossipTransformer {
  constructor() {
    // Opening phrases that sound like a friend texting
    this.openers = [
      "omg",
      "btw",
      "you won't believe this",
      "so apparently",
      "did you hear",
      "okay so",
      "plot twist",
      "wait so",
    ];
    
    // Transition phrases
    this.transitions = [
      "and apparently",
      "plus",
      "also",
      "which means",
    ];
    
    // Closing reactions
    this.reactions = [
      "wild right?",
      "crazy times",
      "what do you think?",
      "just thought you should know",
      "👀",
      "💀",
      "\n\nthat's the tea ☕",
    ];
  }
  
  getRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }
  
  // Main transformation function
  transform(newsItem) {
    const { title, description, source } = newsItem;
    
    // Combine title + description for context
    const fullText = `${title}. ${description}`.replace(/\.{2,}/g, '.');
    
    // Extract key info
    const whatHappened = this.extractWhatHappened(fullText);
    const whyItMatters = this.extractWhyItMatters(fullText);
    
    // Build the gossip
    let gossip = '';
    
    // Opening
    gossip += this.getRandom(this.openers);
    
    // The news (casual)
    gossip += ' ' + this.casualize(whatHappened);
    
    // Add context if relevant
    if (whyItMatters && whyItMatters !== whatHappened) {
      gossip += ' ' + this.getRandom(this.transitions) + ' ';
      gossip += this.casualize(whyItMatters);
    }
    
    // Source attribution (casual)
    if (source && source !== 'unknown') {
      gossip += ` (${source} reported it)`;
    }
    
    // Closing
    gossip += '. ' + this.getRandom(this.reactions);
    
    // Add source link
    const link = newsItem.link || newsItem.url;
    if (link) {
      gossip += `\n\nSource: ${link}`;
    }
    
    return this.cleanup(gossip);
  }
  
  // Extract what actually happened
  extractWhatHappened(text) {
    // Remove fluff, keep the core event
    return text
      .replace(/^.*?\|\s*/i, '') // Remove source prefixes
      .replace(/\s+/g, ' ')
      .split('.')[0] // First sentence usually has the goods
      .trim();
  }
  
  // Extract why it matters
  extractWhyItMatters(text) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim());
    if (sentences.length > 1) {
      return sentences[1].trim();
    }
    return null;
  }
  
  // Make it sound casual
  casualize(text) {
    return text
      // Replace formal words
      .replace(/\bannounced\b/gi, 'said')
      .replace(/\brevealed\b/gi, 'shared')
      .replace(/\baccording to\b/gi, 'apparently')
      .replace(/\breported\b/gi, 'said')
      .replace(/\bstated\b/gi, 'said')
      .replace(/\bapproximately\b/gi, 'like')
      .replace(/\bapproximately\b/gi, 'around')
      .replace(/\bsignificant\b/gi, 'big')
      .replace(/\bsubstantial\b/gi, 'a lot of')
      .replace(/\butilize\b/gi, 'use')
      .replace(/\bimplement\b/gi, 'do')
      .replace(/\binitiative\b/gi, 'thing')
      // Remove formal structures
      .replace(/In a statement,?/gi, '')
      .replace(/It is reported that/gi, 'apparently')
      .replace(/Sources say/gi, 'people are saying')
      // Make numbers casual
      .replace(/(\d+)%/g, '$1 percent')
      .replace(/\$([\d\.]+)\s*billion/gi, '$$$1B')
      .replace(/\$([\d\.]+)\s*million/gi, '$$$1M')
      .trim();
  }
  
  // Final cleanup
  cleanup(text) {
    return text
      .replace(/[ \t]+/g, ' ') // Normalize spaces (not newlines)
      .replace(/\s+([.,!?])/g, '$1')
      .replace(/\(+|\)+/g, '') // Remove extra parentheses
      .replace(/^\w/, c => c.toLowerCase()) // Start lowercase for casual vibe
      .trim();
  }
}

// Specific formatters for different news types
const formatters = {
  tech: (item) => {
    const t = new GossipTransformer();
    let gossip = t.transform(item);
    // Add tech-specific flavor
    if (item.title.toLowerCase().includes('layoff') || item.title.toLowerCase().includes('fired')) {
      gossip += ' tech is rough rn 😬';
    }
    if (item.title.toLowerCase().includes('ai')) {
      gossip = gossip.replace(/\?$/, '') + ' AI is taking over everything fr';
    }
    return gossip;
  },
  
  politics: (item) => {
    const t = new GossipTransformer();
    let gossip = t.transform(item);
    // Keep politics light
    gossip += ' politics am i right';
    return gossip;
  },
  
  entertainment: (item) => {
    const t = new GossipTransformer();
    let gossip = t.transform(item);
    gossip = gossip.replace(/\?$/, '') + ' the drama!! 🍿';
    return gossip;
  },
  
  general: (item) => {
    const t = new GossipTransformer();
    return t.transform(item);
  }
};

// Detect news category
function detectCategory(item) {
  const text = (item.title + ' ' + item.description).toLowerCase();
  
  if (text.match(/\b(tech|ai|apple|google|meta|amazon|startup|app|software|hardware)\b/)) {
    return 'tech';
  }
  if (text.match(/\b(trump|biden|congress|senate|election|vote|policy|government)\b/)) {
    return 'politics';
  }
  if (text.match(/\b(celebrity|movie|tv|show|actor|singer|album|netflix|hollywood)\b/)) {
    return 'entertainment';
  }
  return 'general';
}

// Main export
function transformToGossip(newsItem) {
  const category = detectCategory(newsItem);
  const formatter = formatters[category] || formatters.general;
  return formatter(newsItem);
}

module.exports = { GossipTransformer, transformToGossip, detectCategory };
