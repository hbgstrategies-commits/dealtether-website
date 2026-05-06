import { test, expect } from "@playwright/test";

test.describe("Landing page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("nav shows correct links and CTA", async ({ page }) => {
    const nav = page.getByRole("navigation");
    await expect(nav).toBeVisible();
    await expect(nav.getByRole("link", { name: /how it works/i })).toBeVisible();
    await expect(nav.getByRole("link", { name: /pricing/i })).toBeVisible();
    await expect(nav.getByRole("link", { name: /deal analyzer/i })).toBeVisible();
    await expect(nav.getByRole("link", { name: /start free/i })).toBeVisible();
  });

  test("hero section renders headline and buttons", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /buy a business/i })).toBeVisible();
    await expect(page.getByText(/without guessing/i).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /start free/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /see how it works/i }).first()).toBeVisible();
    await expect(page.getByText(/\$147\/mo/i).first()).toBeVisible();
  });

  test("credibility bar shows stats", async ({ page }) => {
    await expect(page.getByText("$60M+").first()).toBeVisible();
    await expect(page.getByText("$20M+").first()).toBeVisible();
    await expect(page.getByText(/in acquisitions closed/i).first()).toBeVisible();
    await expect(page.getByText(/in SBA loans funded/i).first()).toBeVisible();
  });

  test("why buyers fail section shows 3 failure cards", async ({ page }) => {
    await expect(page.getByText(/why most buyers lose money/i)).toBeVisible();
    await expect(page.getByText(/fooled by the financials/i)).toBeVisible();
    await expect(page.getByText(/what to offer/i).first()).toBeVisible();
    await expect(page.getByText(/falls apart on the way to close/i)).toBeVisible();
  });

  test("how it works shows all 5 stages", async ({ page }) => {
    await expect(page.getByText(/five stages/i).first()).toBeVisible();
    await expect(page.getByText(/find the right business/i)).toBeVisible();
    await expect(page.getByText(/don't get fooled by bad financials/i)).toBeVisible();
    await expect(page.getByText(/know exactly what to offer/i)).toBeVisible();
    await expect(page.getByText(/compare your deals/i)).toBeVisible();
    await expect(page.getByText(/don't let the deal fall apart/i)).toBeVisible();
  });

  test("how it works sourcing stage shows Beta badge", async ({ page }) => {
    await expect(page.getByText("Beta").first()).toBeVisible();
  });

  test("sample outputs tabs switch content", async ({ page }) => {
    await expect(page.getByText(/see exactly what you get/i)).toBeVisible();

    // Deal Analyzer tab is active by default
    await expect(page.locator("#examples").getByText(/recommended offer range/i)).toBeVisible();

    // Switch to Financial Normalizer tab (scroll past sticky nav first)
    const finNormBtn = page.locator("#examples").getByRole("button", { name: /financial normalizer/i });
    await finNormBtn.scrollIntoViewIfNeeded();
    await finNormBtn.click({ force: true });
    await expect(page.locator("#examples").getByText(/add-backs identified/i)).toBeVisible();

    // Switch to Pipeline tab
    const pipeBtn = page.locator("#examples").getByRole("button", { name: /pipeline dashboard/i });
    await pipeBtn.scrollIntoViewIfNeeded();
    await pipeBtn.click({ force: true });
    await expect(page.locator("#examples").getByText(/active deals/i).first()).toBeVisible();

    // Switch to DD tab
    const ddBtn = page.locator("#examples").getByRole("button", { name: /dd workspace/i });
    await ddBtn.scrollIntoViewIfNeeded();
    await ddBtn.click({ force: true });
    await expect(page.locator("#examples").getByText(/weekly report sends/i).first()).toBeVisible();
  });

  test("founder credibility section renders", async ({ page }) => {
    await expect(page.getByText(/not software built by engineers/i)).toBeVisible();
    await expect(page.getByText(/Hunter Goodall/i)).toBeVisible();
    await expect(page.getByText(/no one defaults/i)).toBeVisible();
  });

  test("who its for shows 6 cards", async ({ page }) => {
    await expect(page.getByText(/everyone in the deal/i)).toBeVisible();
    await expect(page.getByText(/first-time buyer/i)).toBeVisible();
    await expect(page.getByText(/ETA \/ search fund/i)).toBeVisible();
    await expect(page.getByText(/acquisition advisor/i).first()).toBeVisible();
    await expect(page.getByText(/business broker/i)).toBeVisible();
    await expect(page.getByText(/roll-up operator/i)).toBeVisible();
    await expect(page.getByText("High-volume organization", { exact: true })).toBeVisible();
  });

  test("pricing section shows 3 plans", async ({ page }) => {
    await expect(page.getByText(/what a mistake costs/i)).toBeVisible();
    await expect(page.getByText("Solo").first()).toBeVisible();
    await expect(page.getByText("Advisor").first()).toBeVisible();
    await expect(page.getByText("Enterprise").first()).toBeVisible();
    await expect(page.getByText("$147").first()).toBeVisible();
    await expect(page.getByText("$397").first()).toBeVisible();
  });

  test("final CTA section renders", async ({ page }) => {
    await expect(page.getByText(/stop guessing/i)).toBeVisible();
    await expect(page.getByText(/start closing/i)).toBeVisible();
  });

  test("footer renders with correct links", async ({ page }) => {
    const footer = page.getByRole("contentinfo");
    await expect(footer.getByText(/deal tether/i)).toBeVisible();
    await expect(footer.getByRole("link", { name: /privacy/i })).toBeVisible();
    await expect(footer.getByRole("link", { name: /terms/i })).toBeVisible();
    await expect(footer.getByRole("link", { name: /contact/i })).toBeVisible();
  });
});
