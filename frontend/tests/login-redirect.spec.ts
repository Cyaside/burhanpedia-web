import { expect, test } from "@playwright/test"

for (const [next, destination] of [
  ["/products?tab=active", /\/products\?tab=active$/],
  ["/%5Cattacker.example", /\/dashboard$/],
  ["/%2Fattacker.example", /\/dashboard$/],
  ["//attacker.example", /\/dashboard$/],
] as const) {
  test(`login redirects safely for ${next}`, async ({ page }) => {
    await page.route("**/api/v1/auth/login", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ user: { name: "Test Buyer" } }),
      }),
    )
    await page.route("**/api/v1/me", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "test-buyer",
          name: "Test Buyer",
          email: "buyer@example.test",
          roles: ["BUYER"],
          activeRole: "BUYER",
        }),
      }),
    )

    await page.goto(`/login?next=${encodeURIComponent(next)}`, { waitUntil: "networkidle" })
    await page.getByLabel("Email").fill("buyer@example.test")
    await page.getByLabel("Password").fill("test-password")
    await page.getByRole("button", { name: "Sign in", exact: true }).click()

    await expect(page).toHaveURL(destination)
    expect(new URL(page.url()).origin).toBe(new URL(test.info().project.use.baseURL!).origin)
  })
}
