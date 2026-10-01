import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import dns from 'dns';

// Fix for Node.js c-ares SRV lookup issue on Windows
dns.setServers(['8.8.8.8', '1.1.1.1']);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

import app from './app.js';
import { connectDatabase } from './data/connection.js';

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

async function startServer() {
  if (!MONGODB_URI) {
    console.error('[Config Error] Neither MONGODB_URI nor MONGO_URI found in server/.env');
    process.exit(1);
  }
  await connectDatabase(MONGODB_URI);
  app.listen(PORT, () => {
    console.log(`[Allocra Server] Running on http://localhost:${PORT}`);
  });
}

startServer();
