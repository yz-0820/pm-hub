import { config } from 'dotenv';
import { resolve } from 'path';

// Load local environment variables for standalone scripts.
config({ path: resolve(process.cwd(), '.env.local'), quiet: true });
