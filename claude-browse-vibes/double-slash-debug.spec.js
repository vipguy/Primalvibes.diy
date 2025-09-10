import { test, expect } from "@playwright/test";

test("debug double slash URL issue", async ({ page }) => {
  // Listen for console logs to capture the debug output
  page.on("console", (msg) => {
    console.log(`[BROWSER] ${msg.type()}: ${msg.text()}`);
  });

  // Listen for network requests to see the actual URL being used
  page.on("request", (request) => {
    if (request.url().includes("chat/completions")) {
      console.log(`[NETWORK] POST to: ${request.url()}`);
    }
  });

  // Navigate to home page
  await page.goto("http://localhost:8889");

  // Wait for the page to load
  await page.waitForLoadState("networkidle");

  // Take a screenshot to see what's on the page
  await page.screenshot({ path: "debug-home-page.png" });

  // Try multiple selectors to find the chat input
  const possibleSelectors = [
    "textarea",
    'input[type="text"]',
    '[placeholder*="chat"]',
    '[placeholder*="message"]',
    '[data-testid*="input"]',
    '[data-testid*="chat"]',
  ];

  let chatInput = null;
  for (const selector of possibleSelectors) {
    const element = page.locator(selector);
    if ((await element.count()) > 0) {
      console.log(`Found input with selector: ${selector}`);
      chatInput = element.first();
      break;
    }
  }

  if (chatInput) {
    await chatInput.fill("test app");
    await chatInput.press("Enter");
  } else {
    // If no input found, just click somewhere to trigger any chat initialization
    console.log("No input found, clicking on page");
    await page.click("body");
  }

  // Wait a bit to see the network requests
  await page.waitForTimeout(3000);
});
