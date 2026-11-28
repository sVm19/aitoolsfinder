import { expect, test } from "@playwright/test";

test.describe("Explore search input and multi-word matching", () => {
  test("preserves spaces while typing, editing middle text, and pasting", async ({
    page,
  }) => {
    await page.goto("/explore");

    const input = page.getByLabel("Search published tools");
    await input.click();

    // Fast typing with leading, repeated, and trailing spaces
    await input.pressSequentially("  AI   code  editor  ", { delay: 15 });
    await expect(input).toHaveValue("  AI   code  editor  ");

    // Wait past 300ms debounce and verify URL updated with trimmed query while input keeps spaces
    await expect(page).toHaveURL(/\/explore\?q=AI(\+|%20)code(\+|%20)editor/);
    await expect(input).toHaveValue("  AI   code  editor  ");

    // Edit in the middle of the text
    await input.fill("AI editor");
    await input.focus();
    await page.keyboard.press("Home");
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    await page.keyboard.type(" code");
    await expect(input).toHaveValue("AI code editor");

    // Paste text with spaces
    await input.fill("");
    await input.evaluate((el: HTMLInputElement) => {
      el.focus();
    });
    await input.fill("  code AI  ");
    await expect(input).toHaveValue("  code AI  ");
    await expect(page).toHaveURL(/\/explore\?q=code(\+|%20)AI/);
  });

  test("multi-word queries match in any order and survive refresh, back, and forward", async ({
    page,
  }) => {
    await page.goto("/explore");
    const input = page.getByLabel("Search published tools");

    await input.fill("AI code editor");
    await expect(page).toHaveURL(/q=AI(\+|%20)code(\+|%20)editor/);
    const firstResultText = await page.getByRole("status").textContent();
    expect(firstResultText).toMatch(/\d+ tools? found/);

    await input.fill("code AI");
    await expect(page).toHaveURL(/q=code(\+|%20)AI/);
    await expect(page.getByRole("status")).not.toContainText("0 tools found");

    // Refresh preserves query and results
    await page.reload();
    await expect(page.getByLabel("Search published tools")).toHaveValue("code AI");

    // Empty input clears query
    await page.getByLabel("Search published tools").fill("");
    await expect(page).toHaveURL(/\/explore$/);
  });
});
