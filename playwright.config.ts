import { defineConfig } from '@playwright/test';
import { existsSync } from 'node:fs';

const integration = process.env.TEST_INTEGRATION === '1';
const port = integration ? 4174 : 4173;
const executable = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined);
export default defineConfig({
  testDir: './tests',
  outputDir: integration ? 'test-results/integration' : 'test-results/site',
  timeout: 30000,
  expect: { timeout: 5000 },
  fullyParallel: true,
  workers: 2,
  reporter: [['list'], ['json', { outputFile: integration ? 'test-results/integration.json' : 'test-results/site.json' }]],
  use: {
    baseURL: `http://127.0.0.1:${port}/BUSN9155_Codex/`,
    headless: true,
    launchOptions: { executablePath: executable, args: ['--no-sandbox'] },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: integration ? 'integration' : 'site', testMatch: integration ? /integration\.spec\.ts/ : /site\.spec\.ts/ }],
  webServer: {
    command: `npm run preview -- ${integration ? '--outDir .test-dist ' : ''}--host 127.0.0.1 --port ${port} --strictPort`,
    url: `http://127.0.0.1:${port}/BUSN9155_Codex/`,
    reuseExistingServer: !process.env.CI,
    env: { VITE_BASE_PATH: '/BUSN9155_Codex/' },
  },
});
