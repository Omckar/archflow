const fs = require('fs');

// Simple .env parser to avoid extra dependencies like 'dotenv'
function parseEnv() {
  try {
    const envPath = './.env';
    if (!fs.existsSync(envPath)) return {};
    
    const content = fs.readFileSync(envPath, 'utf8');
    const lines = content.split('\n');
    const config = {};
    
    lines.forEach(line => {
      const match = line.match(/^\s*([\w\.\-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        let value = match[2] || '';
        // Remove quotes if present
        value = value.trim().replace(/^(['"])(.*)\1$/, '$2');
        config[match[1]] = value;
      }
    });
    return config;
  } catch (e) {
    console.error('Error parsing .env:', e);
    return {};
  }
}

const env = parseEnv();
const apiKey = env.SECRET_KEY || '';

const targetPath = `./src/app/app.key.ts`;
const content = `// This file is auto-generated. Do NOT commit this file to source control.
export const OPENROUTER_API_KEY = '${apiKey}';
`;

fs.writeFileSync(targetPath, content);
console.log(`Success: API Key synced from .env to ${targetPath}`);
