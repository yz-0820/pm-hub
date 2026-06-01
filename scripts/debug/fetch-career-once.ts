import { getEnabledSources } from '../../config/content-sources';
import { fetchCareerContentsBySource } from '../../lib/career/fetcher';

async function main() {
  const sources = getEnabledSources();
  if (sources.length === 0) {
    console.log('No enabled career content sources');
    return;
  }

  const sourceId = process.argv[2] || sources[0].sourceId;
  const source = sources.find(s => s.sourceId === sourceId) || sources[0];

  console.log(`Fetching career contents: ${source.sourceName} (${source.sourceId})`);
  const result = await fetchCareerContentsBySource(source.sourceId);
  console.log(result);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

