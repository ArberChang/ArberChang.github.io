'use strict';
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');

(async () => {
  fs.mkdirSync('.qa', { recursive: true });
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {})
  });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    // 不向真实评论或统计后端发送验证流量。
    await context.route('**/*', route => {
      const url = route.request().url();
      if (url.includes('/valine@')) return route.fulfill({
        contentType: 'application/javascript',
        body: 'window.Valine = class { constructor() { window.valineInitialized = true; } };'
      });
      return new URL(url).hostname === '127.0.0.1' ? route.continue() : route.abort();
    });
    const page = await context.newPage();
    page.setDefaultTimeout(10000);
    const errors = [], missing = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => {
      if (response.status() >= 400) missing.push(response.url());
    });
    await page.goto('http://127.0.0.1:4000/', { waitUntil: 'networkidle' });
    await page.locator('.post-body').first().waitFor({ state: 'visible' });
    assert.match(await page.locator('.menu-item-home').innerText(), /首页/);
    assert.equal(await page.locator('.menu-item-home').evaluate(el => getComputedStyle(el).opacity), '1');
    await page.waitForTimeout(2000); // 等页面入场动画完成后截图。
    await page.screenshot({ path: '.qa/desktop.png', fullPage: true });
    await page.locator('.popup-trigger:visible').first().click();
    await page.locator('.search-input').fill('Docker');
    await page.locator('.search-result-list li').first().waitFor();
    const searchResults = await page.locator('.search-result-list li').count();
    await page.locator('.search-result-list a').first().click();
    await page.waitForURL(/CentOs7/);
    await page.waitForFunction(() => document.querySelector('.post-body')?.textContent.includes('yum'));
    await page.locator('.post-body').waitFor({ state: 'visible' });
    assert.match(await page.locator('.post-body').textContent(), /yum/);
    await page.waitForFunction(() => window.valineInitialized === true);
    await page.locator('a[href="/photos/"]').first().click();
    await page.waitForURL('**/photos/');
    await page.locator('.group-picture-column').first().waitFor();
    assert.equal(await page.locator('.group-picture-column').count(), 11);
    await page.locator('.group-picture-column img').first().click();
    await page.locator('.fancybox__container').waitFor();
    await page.keyboard.press('Escape');
    await page.goto('http://127.0.0.1:4000/series/', { waitUntil: 'networkidle' });
    await page.locator('.post-body a[href*="CentOs7"]').first().click();
    await page.waitForURL(/CentOs7/);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('http://127.0.0.1:4000/', { waitUntil: 'networkidle' });
    await page.locator('.site-nav-toggle').click();
    await page.locator('.popup-trigger:visible').first().click();
    await page.locator('.search-input').fill('Oracle');
    await page.locator('.search-result-list li').first().waitFor();
    await page.waitForTimeout(600);
    await page.screenshot({ path: '.qa/mobile-search.png' });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.locator('.search-input').fill('zzzzzzzzzzzzzzzzzzzzzzzz');
    await page.locator('.search-result-icon .fa-frown').waitFor();
    assert.deepEqual(errors, []);
    assert.deepEqual(missing, []);
    const result = { searchResults, photos: 11, pjax: true, fancybox: true,
      seriesPostLink: true, chineseMenu: true, mobileSearch: true, emptySearch: true,
      horizontalOverflow: false, scriptErrors: errors, localHttpErrors: missing,
      valineInitialization: 'stubbed client; live backend not tested', externalRequests: 'blocked' };
    fs.writeFileSync('.qa/browser-result.json', JSON.stringify(result, null, 2) + '\n');
    console.log(JSON.stringify(result, null, 2));
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
