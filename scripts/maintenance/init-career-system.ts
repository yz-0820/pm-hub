import { initContentSources } from '@/lib/career/fetcher';

async function initCareerSystem() {
  console.log('Initializing career content sources...');
  console.log('Schema creation is managed by npm run db:migrate.');

  try {
    await initContentSources();
    console.log('Career content sources initialized successfully.');
  } catch (error) {
    console.error('Initialization failed:', error);
    process.exit(1);
  }
}

initCareerSystem();
