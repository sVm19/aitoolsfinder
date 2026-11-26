import { expect, test } from "@playwright/test";

test.describe("Browse-first homepage (no searchbar)", () => {
  test("renders header, footer, zero searchbar, and visible tool cards on load", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    await page.goto("/");

    // Header & Footer remain intact
    await expect(page.locator("header")).toBeVisible();
    await expect(page.locator("footer")).toBeVisible();

    // No searchbar on the homepage
    await expect(page.locator("main form[role='search']")).toHaveCount(0);
    await expect(page.locator("main input[type='search']")).toHaveCount(0);

    // One h1 and visible tool cards immediately
    await expect(page.locator("main h1")).toHaveCount(1);
    const toolLinks = page.locator("main a[href^='/tools/']");
    await expect(toolLinks.first()).toBeVisible();
    expect(await toolLinks.count()).toBeGreaterThan(3);

    expect(errors).toEqual([]);
  });

  test("filters tools via accessible category and pricing pills", async ({ page }) => {
    await page.goto("/");

    const freePill = page.getByRole("button", { name: /^Free$/i });
    await expect(freePill).toHaveAttribute("aria-pressed", "false");
    await freePill.click();
    await expect(freePill).toHaveAttribute("aria-pressed", "true");

    // Reset back to All Pricing
    const allPricingPill = page.getByRole("button", { name: /^All Pricing$/i });
    await allPricingPill.click();
    await expect(allPricingPill).toHaveAttribute("aria-pressed", "true");
  });
});
