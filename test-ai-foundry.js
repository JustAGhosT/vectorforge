#!/usr/bin/env node
/**
 * Test script for Azure AI Foundry connection
 * Run with: node test-ai-foundry.js
 */

const endpoint = process.env.AZURE_AI_ENDPOINT;
const apiKey = process.env.AZURE_SECRET_KEY;
const deploymentName = process.env.AZURE_AI_DEPLOYMENT_NAME;

console.log('=== Azure AI Foundry Connection Test ===\n');

// Check environment variables
console.log('1. Checking environment variables...');
const missing = [];
if (!endpoint) missing.push('AZURE_AI_ENDPOINT');
if (!apiKey) missing.push('AZURE_SECRET_KEY');
if (!deploymentName) missing.push('AZURE_AI_DEPLOYMENT_NAME');

if (missing.length > 0) {
  console.error(`   ❌ Missing: ${missing.join(', ')}`);
  console.log('\n   Set these in your .env file or environment.');
  process.exit(1);
}

console.log('   ✅ AZURE_AI_ENDPOINT:', endpoint);
console.log('   ✅ AZURE_SECRET_KEY: [SET]');
console.log('   ✅ AZURE_AI_DEPLOYMENT_NAME:', deploymentName);

// Build the URL - handle both full URL and base endpoint formats
let url = endpoint;
if (!endpoint.includes('/chat/completions')) {
  const baseEndpoint = endpoint.replace(/\/$/, '');
  url = `${baseEndpoint}/openai/deployments/${deploymentName}/chat/completions?api-version=2024-02-01`;
}

console.log('\n2. Testing API connection...');
console.log('   URL:', url);

async function testConnection() {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Say "Hello from AI Foundry!" in exactly those words.' }],
        max_completion_tokens: 50,
        temperature: 0.1
      })
    });

    console.log('   HTTP Status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('   ❌ Error response:', errorText);
      process.exit(1);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    console.log('\n3. Response received:');
    console.log('   ✅ Model response:', content);
    console.log('   ✅ Tokens used:', data.usage?.total_tokens || 'N/A');

    console.log('\n=== Connection successful! ===');
  } catch (error) {
    console.error('   ❌ Connection failed:', error.message);
    process.exit(1);
  }
}

testConnection();
