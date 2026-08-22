import { expect, test } from '@playwright/test';

test.beforeEach(async ({ isMobile }) => {
  test.skip(Boolean(isMobile), 'Storefront interaction smoke runs on desktop.');
});

test('category state follows the selected catalog route', async ({ page }) => {
  const categories = await page.request.get('/api/v1/categories');
  const category = (
    (await categories.json()) as Array<{
      id: string;
      name: string;
      parentId: string | null;
    }>
  ).find((item) => item.parentId === null);
  expect(category).toBeDefined();

  await page.goto(`/products?categoryId=${category!.id}`);
  await expect(
    page.getByRole('link', { name: category!.name, exact: true }),
  ).toHaveClass(/text-primary/);
  await expect(
    page.getByRole('link', { name: 'Semua produk', exact: true }),
  ).toHaveClass(/text-muted-foreground/);
});

test('homepage rotates four stores and another product page', async ({
  page,
}) => {
  await page.goto('/', { waitUntil: 'networkidle' });
  const stores = page.locator('#toko a[href^="/stores/"]');
  await expect(stores).toHaveCount(4);
  const storesBefore = await stores.evaluateAll((links) =>
    links.map((link) => link.getAttribute('href')).sort(),
  );
  await page.locator('#toko').getByRole('button', { name: 'Pilihan lain' }).click();
  await expect
    .poll(() =>
      stores.evaluateAll((links) =>
        links.map((link) => link.getAttribute('href')).sort(),
      ),
    )
    .not.toEqual(storesBefore);

  const section = page.locator('#harga-pilihan');
  const productLinks = section.locator('a[href^="/products/"]');
  const productsBefore = await productLinks.evaluateAll((links) =>
    links.map((link) => link.getAttribute('href')),
  );
  const rotate = section.getByRole('button', { name: 'Pilihan lain' });
  await expect(rotate).toBeVisible();
  await rotate.click();
  await expect
    .poll(() =>
      productLinks.evaluateAll((links) =>
        links.map((link) => link.getAttribute('href')),
      ),
    )
    .not.toEqual(productsBefore);
});

test('store cards lead to an independent storefront', async ({ page }) => {
  await page.goto('/stores', { waitUntil: 'networkidle' });
  const firstStore = page.locator('main a[href^="/stores/"]').first();
  await expect(firstStore).toBeVisible();
  const target = await firstStore.getAttribute('href');
  await firstStore.click();
  await expect(page).toHaveURL(new RegExp(`${target}$`));
  await expect(page.locator('main h1')).toBeVisible();
});
