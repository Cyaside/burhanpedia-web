import { expect, test, type Page } from '@playwright/test';

type Role = 'BUYER' | 'SELLER' | 'DRIVER' | 'ADMIN';

async function mockUser(page: Page, role: Role) {
  await page.route('**/api/v1/me', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: `test-${role.toLowerCase()}`,
        name: `Test ${role}`,
        email: `${role.toLowerCase()}@example.test`,
        roles: [role],
        activeRole: role,
      }),
    }),
  );
}

for (const role of ['ADMIN', 'SELLER', 'DRIVER'] as const) {
  test(`${role} cannot see or open buyer cart`, async ({ page }) => {
    await mockUser(page, role);
    await page.goto('/products', { waitUntil: 'networkidle' });
    await expect(
      page.getByRole('navigation', { name: 'Akun dan keranjang' }).getByRole('link', { name: 'Keranjang' }),
    ).toHaveCount(0);
    await expect(page.getByRole('navigation', { name: 'Navigasi utama mobile' }).getByRole('link', { name: 'Keranjang' })).toHaveCount(0);

    await page.goto('/cart', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByText('Akses tidak tersedia')).toBeVisible();
  });
}

test('buyer sees cart but cannot open admin workspace', async ({ page }) => {
  await mockUser(page, 'BUYER');
  await page.goto('/products', { waitUntil: 'networkidle' });
  await expect(page.getByRole('navigation', { name: 'Akun dan keranjang' }).getByRole('link', { name: 'Keranjang' })).toBeVisible();

  await page.goto('/admin', { waitUntil: 'networkidle' });
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByText('Akses tidak tersedia')).toBeVisible();
});

test('switching active role updates navigation immediately', async ({ page }) => {
  let activeRole: Role = 'BUYER';
  await page.route('**/api/v1/me', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'test-multi-role',
        name: 'Test Multi Role',
        email: 'multi@example.test',
        roles: ['BUYER', 'SELLER'],
        activeRole,
      }),
    }),
  );
  await page.route('**/api/v1/me/roles/active', (route) => {
    activeRole = route.request().postDataJSON().role as Role;
    return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });

  await page.goto('/dashboard', { waitUntil: 'networkidle' });
  await expect(page.getByRole('navigation', { name: 'Akun dan keranjang' }).getByRole('link', { name: 'Keranjang' })).toBeVisible();
  await page.getByRole('button', { name: 'Seller' }).click();
  await expect(page.getByRole('heading', { name: 'Pusat seller' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Akun dan keranjang' }).getByRole('link', { name: 'Keranjang' })).toHaveCount(0);
});

test('selected variant determines the cart item', async ({ page, isMobile }) => {
  test.skip(Boolean(isMobile), 'Desktop purchase panel is covered here.');
  await mockUser(page, 'BUYER');
  const productId = 'test-product';
  const variantId = 'test-variant-plus';
  await page.route(`**/api/v1/products/${productId}`, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: productId,
        slug: productId,
        name: 'Tas harian',
        description: 'Produk uji varian.',
        store: { id: 'test-store', slug: 'test-store', name: 'Toko Test', logoUrl: null, logoAltText: null },
        category: null,
        minPriceAmount: '100000',
        ratingAverage: 0,
        ratingCount: 0,
        soldCount: 0,
        availableQuantity: 9,
        images: [],
        variants: [
          { id: 'test-variant-standard', name: 'Standar', attributes: {}, priceAmount: '100000', availableQuantity: 5 },
          { id: variantId, name: 'Paket Plus', attributes: { paket: 'Plus' }, priceAmount: '150000', availableQuantity: 4 },
        ],
        createdAt: '2026-07-23T13:00:00Z',
      }),
    }),
  );
  await page.route(`**/api/v1/products/${productId}/reviews`, (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '{"items":[]}' }),
  );
  let postedVariant: string | undefined;
  await page.route('**/api/v1/cart/items', (route) => {
    postedVariant = route.request().postDataJSON().variantId as string;
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: '{"id":"test-cart","version":1,"groups":[],"subtotalAmount":"0"}',
    });
  });

  await page.goto(`/products/${productId}`, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Paket Plus' }).click();
  await expect(page.getByText('Pilih varian: Paket Plus')).toBeVisible();
  await expect(page.getByText('Rp 150.000').first()).toBeVisible();
  await page.getByRole('button', { name: 'Tambah ke keranjang' }).click();
  await expect(page.getByText('Produk masuk ke keranjang.')).toBeVisible();
  expect(postedVariant).toBe(variantId);
});
