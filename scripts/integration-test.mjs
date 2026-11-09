import { spawnSync } from 'node:child_process';
// These values identify isolated mocks, not a real form or GA4 property.
// This separate build is never the GitHub Pages artifact.
const env = { ...process.env, VITE_BASE_PATH: '/BUSN9155_Codex/', VITE_GTM_CONTAINER_ID: '', VITE_FORMSPREE_ENDPOINT: 'https://formspree.io/f/localLiftTestOnly', VITE_GA4_MEASUREMENT_ID: 'G-TESTONLY123', TEST_INTEGRATION: '1' };
for (const args of [['run','build','--','--outDir','.test-dist'], ['exec','playwright','test','--','--project=integration']]) {
  const result = spawnSync('npm', args, { env, stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status || 1);
}
