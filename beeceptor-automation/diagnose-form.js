const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const page = await browser.newPage();
  const endpointName = `playwright-test-${Date.now()}`;
  await page.goto('https://beeceptor.com/');
  await page.locator('#channel').fill(endpointName);
  await page.locator('button:has-text("Create Mock Server")').click();
  await page.waitForTimeout(4000);

  // Click Mock Rules
  await page.locator('text=/Mock Rules/i').first().click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'step1-mock-rules.png' });

  // Click the dropdown toggle
  await page.locator('button:has-text("Toggle Dropdown")').first().click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'step2-dropdown.png' });

  // Click New Callout Rule
  await page.locator('text="New Callout Rule"').first().click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'step3-callout-form.png' });

  // Dump all inputs
  const inputs = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('input, textarea')).map(el => {
      return `tag:${el.tagName}, type:${el.type}, name:${el.name}, id:${el.id}, placeholder:"${el.placeholder}", class:${el.className}`;
    });
  });
  console.log('=== Inputs Found ===');
  console.log(inputs.join('\n'));

  await browser.close();
})();
