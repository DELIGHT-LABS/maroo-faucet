import { expect, test } from "@playwright/test";

test.describe("Lux Faucet", () => {
  test("should load the homepage", async ({ page }) => {
    await page.goto("/");

    // Wait for hydration
    await page.waitForLoadState("networkidle");

    // Check if page loaded
    expect(await page.isVisible("body")).toBeTruthy();

    // Check for basic elements
    const title = await page.title();
    expect(title).toBeTruthy();
  });

  test("should have RainbowKit connect button", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // RainbowKit button should be present
    const connectButton = page.locator('button:has-text("Connect")').first();
    await expect(connectButton).toBeVisible({ timeout: 10000 });
  });

  test("should not have console errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Filter out known SSR warnings
    const filteredErrors = errors.filter(
      (error) =>
        !error.includes("indexedDB is not defined") &&
        !error.includes("WalletConnect"),
    );

    expect(filteredErrors).toHaveLength(0);
  });

  test("should be responsive", async ({ page }) => {
    // Test desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto("/");
    expect(await page.isVisible("body")).toBeTruthy();

    // Test tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    expect(await page.isVisible("body")).toBeTruthy();

    // Test mobile
    await page.setViewportSize({ width: 375, height: 667 });
    expect(await page.isVisible("body")).toBeTruthy();
  });
});

test.describe("Backend API", () => {
  test("should respond to health check", async ({ request }) => {
    const response = await request.get("http://localhost:8000/health");
    expect(response.ok()).toBeTruthy();
  });

  test("should have CORS headers", async ({ request }) => {
    const response = await request.options("http://localhost:8000/api");
    const headers = response.headers();
    expect(headers["access-control-allow-origin"]).toBeDefined();
  });
});
