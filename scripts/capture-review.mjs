import { chromium } from '@playwright/test';
import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';

const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined);
const browser = await chromium.launch({executablePath,args:['--no-sandbox']});
await mkdir('docs/evidence',{recursive:true});
try {
  for (const [device,width,height] of [['desktop',1440,1000],['mobile',390,844]]) {
    const page = await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
    await page.route('https://**/*',route=>route.abort('blockedbyclient'));
    for (const [name,path] of [['home',''],['about','about.html'],['audit','audit.html'],['coverage','coverage-checklist.html'],['enquire','enquire.html']]) {
      await page.goto(`http://127.0.0.1:4173/BUSN9155_Codex/${path}`);
      await page.evaluate(()=>document.fonts.ready);
      await page.screenshot({path:`docs/evidence/${name}-${device}.png`,fullPage:true});
      console.log(`Captured ${name}-${device}.png`);
    }
    await page.close();
  }
} finally { await browser.close(); }
