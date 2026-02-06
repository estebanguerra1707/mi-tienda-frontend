import { test as setup, expect } from "@playwright/test";

setup("auth: admin", async ({ page }) => {
  const email = process.env.ADMIN_EMAIL;
  const pass = process.env.ADMIN_PASS;

  if (!email || !pass) {
    throw new Error("Faltan ADMIN_EMAIL / ADMIN_PASS en .env.e2e");
  }

  await page.goto("/login");

  await page.getByPlaceholder(/correo electrónico/i).fill(email);
  await page.locator('input[type="password"]').fill(pass);
  await page.getByRole("button", { name: /entrar/i }).click();

  await expect(page).not.toHaveURL(/\/login/);

  // Guarda sesión/cookies/localStorage
  await page.context().storageState({ path: "test-results/storage-admin.json" });
});
