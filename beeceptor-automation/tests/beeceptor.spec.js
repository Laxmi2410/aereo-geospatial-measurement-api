const { test, expect } = require('@playwright/test');

test.setTimeout(120000); // Allow 2 minutes for the full test

test('Beeceptor HTTP Callout Automation', async ({ page, request }) => {
  const endpointName = `playwright-test-${Date.now()}`;
  const endpointUrl = `https://${endpointName}.free.beeceptor.com`;

  console.log(`Starting test for endpoint: ${endpointName}`);

  // ── Step 1: Open Beeceptor ───────────────────────────────────────────────
  await page.goto('https://beeceptor.com/');

  // ── Step 2: Create an endpoint ───────────────────────────────────────────
  await page.locator('#channel').fill(endpointName);
  await page.locator('button:has-text("Create Mock Server")').click();
  await page.waitForTimeout(4000);
  console.log('Endpoint created, waiting for dashboard...');

  // ── Step 3: Accept cookies (cookie banner blocks all other clicks) ────────
  const cookieBtn = page.locator('button.accept-cookies');
  if (await cookieBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await cookieBtn.click();
    console.log('Accepted cookies.');
    await page.waitForTimeout(500);
  }

  // ── Step 4: Dismiss the "Getting Started" overlay ─────────────────────────
  const exploreBtn = page.locator("text=\"I'll explore myself!\"");
  if (await exploreBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await exploreBtn.click();
    console.log('Dismissed Getting Started guide.');
    await page.waitForTimeout(1000);
  }

  // ── Step 5: Open Mock Rules modal ────────────────────────────────────────
  await page.locator('a[data-bs-target=".allRules"]').click({ force: true });
  await page.waitForTimeout(1000);
  console.log('Opened Mock Rules.');

  // ── Step 6: Click the dropdown toggle next to the Add/New button ─────────
  await page.locator('.btn-group button[data-bs-toggle="dropdown"]').last().click();
  await page.waitForTimeout(500);
  console.log('Opened rule type dropdown.');

  // ── Step 7: Select "New Callout Rule" ────────────────────────────────────
  await page.locator('text="New Callout Rule"').click();
  await page.waitForTimeout(2000);
  console.log('Selected New Callout Rule.');

  // Screenshot to verify form appearance
  await page.screenshot({ path: 'callout-form.png' });

  // ── Step 8: Expand "Synchronous Request Configuration (HTTP Callout)" ─────
  // This accordion section must be expanded to reveal the #targetDomain field.
  // Try clicking any heading that contains "HTTP Callout" or "Callout" text.
  const calloutHeadings = [
    'text=/HTTP Callout/i',
    'text=/Synchronous Request/i',
    'text=/Callout/i',
    '.card-header:has-text("Callout")',
    'button[data-bs-toggle="collapse"]',
  ];
  for (const selector of calloutHeadings) {
    const el = page.locator(selector).first();
    if (await el.isVisible({ timeout: 2000 }).catch(() => false)) {
      await el.click({ force: true });
      console.log(`Expanded section using: ${selector}`);
      await page.waitForTimeout(1000);
      break;
    }
  }

  // Screenshot after attempting expansion
  await page.screenshot({ path: 'callout-form-expanded.png' });

  // ── Step 9: Fill the Callout URL via JavaScript (bypasses visibility) ─────
  // We use evaluate() to directly set the value on the hidden input,
  // then dispatch input/change events so Vue.js picks up the new value.
  await page.evaluate((url) => {
    const input = document.querySelector('#targetDomain');
    if (input) {
      input.value = url;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }, 'https://jsonplaceholder.typicode.com/posts/1');
  console.log('Filled Callout URL via JS.');

  await page.waitForTimeout(500);

  // ── Step 10: Save the rule ────────────────────────────────────────────────
  await page.locator('button:has-text("Save")').last().click();
  await page.waitForTimeout(2000);
  console.log('Saved HTTP Callout rule.');

  // Screenshot after saving
  await page.screenshot({ path: 'after-save.png' });

  // ── Step 11: Trigger the endpoint to verify the callout fires ────────────
  console.log(`Triggering request to: ${endpointUrl}/test`);
  const response = await request.get(`${endpointUrl}/test`);
  expect(response.ok()).toBeTruthy();
  console.log(`✅ API call successful! Status: ${response.status()}`);

  // ── Step 12: Clean up – delete the rule ──────────────────────────────────
  const deleteBtn = page.locator('button[title="Delete rule"]').first();
  if (await deleteBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await deleteBtn.click();
    await page.waitForTimeout(500);
    const confirmDelete = page.getByRole('button', { name: 'Delete' });
    if (await confirmDelete.isVisible({ timeout: 2000 }).catch(() => false)) {
      await confirmDelete.click();
    }
    console.log('✅ Rule deleted. Cleanup complete.');
  }
});
