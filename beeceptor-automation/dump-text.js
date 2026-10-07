const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const endpointName = `playwright-test-${Date.now()}`;
  await page.goto('https://beeceptor.com/');
  await page.locator('#channel').fill(endpointName);
  await page.locator('button:has-text("Create Mock Server")').click();
  await page.waitForURL(`**/console/${endpointName}`);
  await page.waitForLoadState('networkidle');
  
  const texts = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('a, button, [role="button"], .nav-link, .btn')).map(el => el.innerText || el.textContent).map(t => t.trim()).filter(t => t.length > 0);
  });
  console.log(texts.join('\n'));
  await browser.close();
})();
