import { chromium } from 'playwright';
import { mkdir } from 'fs/promises';
import path from 'path';

const outDir = process.env.SCREENSHOT_DIR || '/Users/matthewleray/s2/docs/docs/proxymock/guides/sql-compare';
const baseURL = process.env.PROXYMOCK_WEB_URL || 'http://127.0.0.1:7799';

await mkdir(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

await page.goto(baseURL, { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);

// Automations menu with Compare SQL entry (capture before opening compare).
await page.evaluate(() => {
  if (typeof setActiveTab === 'function') setActiveTab('requests');
  const wrap = document.getElementById('automationsWrap');
  if (wrap) wrap.style.display = '';
});
await page.waitForTimeout(600);
await page.click('#automationsBtn');
await page.waitForSelector('#automationsMenu:not([hidden])', { timeout: 5000 });
await page.evaluate(() => {
  const item = document.querySelector('.automation-item[data-id="sql.compare"]');
  if (item) item.scrollIntoView({ block: 'center' });
});
await page.waitForTimeout(300);
await page.locator('#automationsMenu').screenshot({ path: path.join(outDir, '06-automations-menu.png') });
await page.keyboard.press('Escape');
await page.waitForTimeout(300);

// Open SQL compare picker via the same entry point as the Automations menu.
await page.evaluate(async () => {
  if (typeof window.dataframesOpenSQLCompare === 'function') {
    await window.dataframesOpenSQLCompare(() => {});
  } else {
    throw new Error('dataframesOpenSQLCompare not available');
  }
});
await page.waitForFunction(() => {
  const picker = document.getElementById('dfComparePicker');
  return picker && getComputedStyle(picker).display === 'flex';
}, { timeout: 15000 });
await page.waitForFunction(() => {
  const sel = document.getElementById('dfCompareBaseline');
  return sel && sel.options && sel.options.length >= 2;
}, { timeout: 15000 });

await page.selectOption('#dfCompareBaseline', 'recorded-v1');
await page.selectOption('#dfCompareCandidate', 'recorded-v2');
await page.locator('#dfComparePicker').screenshot({ path: path.join(outDir, '01-compare-picker.png') });

await page.click('#dfCompareRun');
await page.waitForFunction(() => {
  const title = document.getElementById('dfReportTitle');
  return title && title.textContent === 'SQL compare';
}, { timeout: 30000 });
await page.waitForTimeout(800);

await page.locator('#dfReportModal').screenshot({ path: path.join(outDir, '02-what-changed.png') });

await page.click('.df-filter-chip[data-filter="changed"]').catch(() => {});
await page.waitForTimeout(400);
await page.locator('#dfReportModal').screenshot({ path: path.join(outDir, '03-statements-changed.png') });

await page.click('.df-chapter-tab[data-chapter="performance"]');
await page.waitForTimeout(400);
await page.locator('#dfReportModal').screenshot({ path: path.join(outDir, '04-performance-drift.png') });

await page.click('.df-chapter-tab[data-chapter="schema"]');
await page.waitForTimeout(400);
await page.locator('#dfReportModal').screenshot({ path: path.join(outDir, '05-schema-panel.png') });

await browser.close();
console.log('Screenshots saved to', outDir);
