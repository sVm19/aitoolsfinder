import { expect, test } from "@playwright/test";

const apiBase =
  process.env.API_BASE_URL ?? "https://aitoolsfinder.cloud/api/v1";

test("catalog, tool detail, compare, ai finder, and outbound", async ({
  page,
  request,
}) => {
  await page.goto("/explore");
  const firstTool = page.locator('a[href^="/tools/"]').first();
  await expect(firstTool).toBeVisible();
  await firstTool.click();
  await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();

  const catalog = await request.get(`${apiBase}/tools?page_size=2`);
  const catalogBody = await catalog.json();
  const tools = (catalogBody.items ?? []) as Array<{ id: string; slug: string }>;
  expect(tools.length).toBeGreaterThan(0);

  if (tools.length >= 2) {
    await page.goto(
      `/compare/preview?tool=${tools[0].slug}&tool=${tools[1].slug}`,
    );
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
  }

  await page.goto("/ai-finder");
  await page
    .getByRole("textbox", { name: /describe what you need/i })
    .fill("Best AI tool for podcast transcripts");
  await page.getByRole("button", { name: /find tools/i }).click();
  await expect(
    page.getByText(/tools found|No tools match|temporarily unavailable/i).first(),
  ).toBeVisible({ timeout: 30_000 });

  const outbound = await request.post(`${apiBase}/outbound/${tools[0].id}`, {
    failOnStatusCode: false,
  });
  expect([200, 404]).toContain(outbound.status());
});
