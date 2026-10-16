// NODE_PATH=<directory containing playwright> node tests/static_navigation_browser.cjs [base URL]
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium, expect } = require('playwright/test');

const root = path.resolve(__dirname, '..');
const base = process.argv[2] || 'http://127.0.0.1:8081';
const output = process.argv[3] || '/private/tmp/taxcalc-navigation';
const routes = fs.readdirSync(path.join(root, 'build/content')).filter(name => name.endsWith('.html'))
  .map(name => JSON.parse(fs.readFileSync(path.join(root, 'build/content', name), 'utf8').split('---')[1]).id);

async function main() {
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({ headless: true, channel: process.env.PLAYWRIGHT_CHANNEL });
  const context = await browser.newContext();
  // Keep tests independent of ad network availability.
  await context.route('**/*', route => /googlesyndication|doubleclick/.test(route.request().url())
    ? route.abort() : route.continue());
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.setDefaultTimeout(10000);
  try {
    for (const width of process.env.NAVIGATION_FLOWS_ONLY ? [] : [1440, 1024, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      for (const id of routes) {
        await page.goto(`${base}/${id}.html`, { waitUntil: 'domcontentloaded' });
        await expect(page.locator('#sidebar .sidebar-category')).toHaveCount(8);
        await expect(page.locator('#sidebar .sidebar-item')).toHaveCount(routes.length);
        const active = page.locator('#sidebar [aria-current="page"]');
        await expect(active).toHaveCount(1);
        await expect(active).toHaveAttribute('href', `/${id}.html`);
        await expect(page.locator(`#cat-${id.split('/')[0]}`)).toHaveAttribute('aria-expanded', 'true');
        assert.equal(await page.locator('#sidebar').isVisible(), width >= 640, `${width}: ${id}`);
        if (await page.locator('#calculator').count()) {
          await expect(page.locator('body')).toHaveAttribute('data-calculator-ready', 'true');
        }
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
        assert.equal(overflow, false, `Horizontal overflow at ${width}: ${id}`);
      }
      console.log(`${width}px: ${routes.length} pages, navigation, active category, calculator initialization and overflow passed`);
    }

    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(base, { waitUntil: 'domcontentloaded' });
    await page.locator('.welcome-card[href="/real-estate/commission.html"]').click();
    await expect(page).toHaveURL(`${base}/real-estate/commission.html`);
    await expect(page.locator('#sidebar')).toBeVisible();
    await page.locator('#comm-price').fill('100000000');
    await expect(page.locator('#comm-result .total')).toContainText('550,000');
    await page.screenshot({ path: path.join(output, 'desktop-commission.png') });
    await page.locator('#cat-income').click();
    await expect(page.locator('#items-real-estate')).toBeHidden();
    await page.locator('#nav-income-customs').click();
    await expect(page).toHaveURL(`${base}/income/customs.html`);
    await expect(page.locator('#nav-income-customs')).toHaveAttribute('aria-current', 'page');
    await page.goBack();
    await expect(page).toHaveURL(`${base}/real-estate/commission.html`);
    await expect(page.locator('#nav-real-estate-commission')).toHaveAttribute('aria-current', 'page');
    await page.goForward();
    await expect(page).toHaveURL(`${base}/income/customs.html`);

    await page.getByLabel('계산기 검색', { exact: true }).fill('재산세');
    await page.locator('#search-results a[href="/real-estate/property-tax.html"]').click();
    await expect(page).toHaveURL(`${base}/real-estate/property-tax.html`);
    await page.locator('#btn-theme').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page.locator('#btn-theme').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await page.evaluate(() => window.scrollTo(0, 1500));
    await expect.poll(() => page.locator('#sidebar').evaluate(el => Math.round(el.getBoundingClientRect().top))).toBe(60);
    await page.emulateMedia({ media: 'print' });
    await expect(page.locator('#sidebar')).toBeHidden();
    await expect(page.locator('#calculator')).toBeVisible();
    await page.emulateMedia({ media: 'screen' });
    await page.locator('#logo-home').click();
    await expect(page).toHaveURL(`${base}/`);
    await expect(page.locator('.welcome-card')).toHaveCount(routes.length);

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${base}/real-estate/commission.html`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: '계산기 메뉴', exact: true }).click();
    await expect(page.locator('#sidebar')).toBeVisible();
    await expect(page.locator('#btn-hamburger')).toHaveAttribute('aria-expanded', 'true');
    await page.screenshot({ path: path.join(output, 'mobile-menu.png') });
    await page.locator('#cat-income').click();
    await page.locator('#nav-income-customs').click();
    await expect(page).toHaveURL(`${base}/income/customs.html`);
    await expect(page.locator('#sidebar')).toBeHidden();
    await page.locator('#btn-hamburger').click();
    await page.keyboard.press('Escape');
    await expect(page.locator('#sidebar')).toBeHidden();
    await expect(page.locator('#btn-hamburger')).toHaveAttribute('aria-expanded', 'false');
    await page.screenshot({ path: path.join(output, 'mobile-calculator.png') });
    await page.evaluate(() => window.scrollTo({ top: 1500, behavior: 'instant' }));
    await page.locator('#btn-hamburger').click();
    await expect(page.locator('#sidebar')).toBeInViewport({ ratio: 0.5 });
    await page.keyboard.press('Escape');
    await page.goto(`${base}/#real-estate/commission?price=100000000`, { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(`${base}/real-estate/commission.html?price=100000000`);
    await expect(page.locator('#sidebar .sidebar-item')).toHaveCount(routes.length);
    for (const width of [390, 320]) {
      await page.setViewportSize({ width, height: 844 });
      await page.goto(base, { waitUntil: 'domcontentloaded' });
      const headerFits = await page.locator('.header-actions').evaluate(el => el.getBoundingClientRect().right <= innerWidth);
      assert.equal(headerFits, true, `Home header overflow at ${width}`);
      await page.locator('#btn-hamburger').click();
      await expect(page.locator('#sidebar')).toBeInViewport({ ratio: 0.5 });
      await page.locator('#cat-real-estate').click();
      await page.locator('#nav-real-estate-commission').click();
      await expect(page).toHaveURL(`${base}/real-estate/commission.html`);
    }
    assert.deepEqual(errors, [], 'Unexpected browser errors');
    console.log('Home/card, calculator input, longest category, cross-category, back/forward, search, theme, sticky sidebar, print, logo, mobile and legacy URL flows passed');
  } finally {
    await context.close();
    await browser.close();
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
