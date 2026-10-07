const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const endpointName = `playwright-test-${Date.now()}`;
  await page.goto('https://beeceptor.com/');
  await page.locator('#channel').fill(endpointName);
  await page.locator('button:has-text("Create Mock Server")').click();
  await page.waitForURL(`**/console/${endpointName}**`);
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: 'dashboard.png' });
  await browser.close();
})();
