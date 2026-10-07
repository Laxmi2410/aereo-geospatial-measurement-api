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
  
  await page.getByText('Mock Rules (').first().click();
  await page.getByRole('button', { name: 'Toggle Dropdown' }).click();
  await page.getByText('New Callout Rule').click();

  await page.waitForTimeout(1000); // Wait for form to appear

  const inputs = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('input, select, textarea')).map(el => {
      return `${el.tagName.toLowerCase()}[type=${el.type}] - name:${el.name}, id:${el.id}, placeholder:${el.placeholder}, aria-label:${el.getAttribute('aria-label')}`;
    });
  });
  console.log(inputs.join('\n'));
  
  await browser.close();
})();
