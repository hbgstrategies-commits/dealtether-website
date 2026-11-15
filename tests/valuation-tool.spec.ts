import { test, expect, type Page } from "@playwright/test";

// Walks the tool with the sample deal saved in "General Napkin Tool 10.0.xlsx".
async function fillFinancials(page: Page) {
  await page.goto("/valuation/preview?today=2026-11-14");
  await page.getByLabel("State").selectOption("TX");
  await page.getByLabel("Asking price").fill("750000");
  const cells: Record<string, string> = {
    "2023 revenue": "766344",
    "2024 revenue": "964977",
    "2025 revenue": "978718",
    "2026 YTD revenue": "1151038",
    "2023 SDE": "198192",
    "2024 SDE": "267558",
    "2025 SDE": "220327",
    "2026 YTD SDE": "242683",
  };
  for (const [label, value] of Object.entries(cells)) await page.getByLabel(label, { exact: true }).fill(value);
  await page.getByLabel("YTD through date").fill("2026-12-31");
}

async function setScore(page: Page, label: string, value: string) {
  await page.getByLabel(label, { exact: true }).fill(value);
}

test.describe("Valuation 3.0", () => {
  test("is behind the paywall for signed-out visitors", async ({ page }) => {
    await page.goto("/valuation");
    await expect(page.getByTestId("valuation-tool")).toHaveCount(0);
  });

  test("cannot continue until the latest full year is entered", async ({ page }) => {
    await page.goto("/valuation/preview?today=2026-11-14");
    await expect(page.getByText("Enter 2025 revenue and SDE to see the forecast.")).toBeVisible();
    await expect(page.getByRole("button", { name: /rate the business/i })).toBeDisabled();
  });

  test("shows the forecast as soon as financials are entered", async ({ page }) => {
    await fillFinancials(page);
    await expect(page.getByRole("heading", { name: "2026 full-year forecast" })).toBeVisible();
    await expect(page.getByText(/treated as a full year of actuals/i)).toBeVisible();
    await expect(page.getByText("$1,151,038").first()).toBeVisible();
    await expect(page.getByText("Growing trend")).toBeVisible();
  });

  test("a partial-year YTD is blended into a forecast", async ({ page }) => {
    await fillFinancials(page);
    await page.getByLabel("2026 YTD revenue", { exact: true }).fill("560000");
    await page.getByLabel("2026 YTD SDE", { exact: true }).fill("120000");
    await page.getByLabel("YTD through date").fill("2026-06-30");
    await expect(page.getByText(/50\.0% of the year's revenue is earned/)).toBeVisible();
  });

  test("reproduces the spreadsheet's valuation end to end", async ({ page }) => {
    await fillFinancials(page);
    await page.getByRole("button", { name: /rate the business/i }).click();

    await setScore(page, "Client concentration", "3.5");
    await setScore(page, "Industry multiple", "3.25");
    await setScore(page, "Market", "2.5");
    await setScore(page, "Team", "3");
    await setScore(page, "History", "4");
    await setScore(page, "Portfolio", "3");
    await setScore(page, "Opportunity", "3.25");
    await setScore(page, "Buyer demand", "2");
    await page.getByRole("button", { name: /see the valuation/i }).click();

    await expect(page.getByTestId("weighted-sde")).toContainText("$239,833");
    await expect(page.getByTestId("multiple")).toContainText("2.8");
    for (const id of ["cash-offer", "fair-market-value", "concluded-value", "creative-ceiling"])
      await expect(page.getByTestId(id)).toContainText("$");
    await expect(page.getByText("Within the comp middle 50% — supported by market")).toBeVisible();

    const cashOffer = page.getByTestId("cash-offer");
    const before = await cashOffer.innerText();
    await page.getByText("Aggressive offer", { exact: true }).click();
    await expect(cashOffer).toContainText("10.0% risk discount (aggressive)");
    expect(await cashOffer.innerText()).not.toBe(before);
    await page.getByText("Aggressive offer", { exact: true }).click();
    await expect(cashOffer).not.toContainText("aggressive");

    await page.getByRole("button", { name: /structure the deal/i }).click();
    await page.getByLabel("Offer price").fill("230000");
    await page.getByLabel("Cash down percent").fill("21.7391304");
    await expect(page.getByText("$180,000")).toBeVisible();
    await expect(page.getByText("9.38x")).toBeVisible();
    await expect(page.getByText("127.9%")).toBeVisible();
    await expect(page.getByText("$156,452").first()).toBeVisible();

    await page.getByRole("button", { name: "← Back" }).click();
    await expect(page.getByTestId("creative-ceiling")).toContainText("$738,5");
  });
});
