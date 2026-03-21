#!/usr/bin/env node
// Local cron runner - runs auto-post every minute
// No LLM credits needed!

const { exec } = require('child_process');
const path = require('path');

console.log('☕ Starting The Friend local cron (every 60 seconds)...');
console.log('Press Ctrl+C to stop\n');

function runAutoPost() {
  const scriptPath = path.join(__dirname, 'scripts/auto-post.js');
  
  exec(`node "${scriptPath}"`, { cwd: __dirname }, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`stderr: ${stderr}`);
    }
    console.log(stdout);
  });
}

// Run immediately
runAutoPost();

// Then every 60 seconds
setInterval(runAutoPost, 60000);

// Keep process alive
process.stdin.resume();
