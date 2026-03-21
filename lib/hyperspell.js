const Hyperspell = require('hyperspell');
require('dotenv').config({ path: '../.env.local' });

// Add text memory
async function addMemory({ userId, text, title, collection, metadata }) {
  const client = new Hyperspell({
    apiKey: process.env.HYPERSPELL_API_KEY,
    userID: userId,
  });

  const response = await client.memories.add({
    text,
    title,
    collection,
    metadata,
  });

  return response;
}

// Upload file
async function uploadFile({ userId, filePath, collection, metadata }) {
  const fs = require('fs');
  const client = new Hyperspell({
    apiKey: process.env.HYPERSPELL_API_KEY,
    userID: userId,
  });

  const response = await client.memories.upload({
    file: fs.createReadStream(filePath),
    collection,
    metadata: metadata ? JSON.stringify(metadata) : undefined,
  });

  return response;
}

// List memories
async function listMemories({ userId, collection, source, size = 50 }) {
  const client = new Hyperspell({
    apiKey: process.env.HYPERSPELL_API_KEY,
    userID: userId,
  });

  const memories = [];
  for await (const memory of client.memories.list({ collection, source, size })) {
    memories.push(memory);
  }

  return memories;
}

// Search memories
async function searchMemories(userId, query, options = {}) {
  const { answer = false } = options;
  
  const client = new Hyperspell({
    apiKey: process.env.HYPERSPELL_API_KEY,
    userID: userId,
  });

  const response = await client.memories.search({
    query,
    answer,
  });

  return response;
}

module.exports = { addMemory, uploadFile, listMemories, searchMemories };
