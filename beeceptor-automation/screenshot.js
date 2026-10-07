const { chromium } = require('@playwright/test');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('https://beeceptor.com/');
  await page.screenshot({ path: 'home.png' });
  await browser.close();
})();
