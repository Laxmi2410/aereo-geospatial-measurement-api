const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const endpointName = `playwright-test-${Date.now()}`;
  await page.goto('https://beeceptor.com/');
  await page.locator('#channel').fill(endpointName);
  await page.locator('button:has-text("Create Mock Server")').click();
  await page.waitForURL(`**/console/${endpointName}`);
  
  await page.goto(`https://app.beeceptor.com/console/${endpointName}/rules`);
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: 'rules.png' });

  // click create rule if available
  try {
    await page.getByRole('button', { name: /Create New Rule/i }).click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'create-rule.png' });
  } catch (e) {
    console.log('Could not click Create New Rule');
  }

  await browser.close();
})();
