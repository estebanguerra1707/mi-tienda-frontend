import { test, expect } from "@playwright/test";

test("Login Admin: entra y muestra pantalla admin", async ({ page }) => {
  const email = process.env.ADMIN_EMAIL;
  const pass = process.env.ADMIN_PASS;

  if (!email || !pass) {
    throw new Error("Faltan variables ADMIN_EMAIL y ADMIN_PASS");
  }

  await page.goto("/login");

await page.getByPlaceholder(/correo electrónico/i).fill(email);
await page.locator('input[type="password"]').fill(pass);
await page.getByRole("button", { name: /entrar/i }).click();

  // Espera navegación y valida que ya no estás en login
  await expect(page).not.toHaveURL(/\/login/);

  // Indicador visible de que estás logueado (ajusta a tu UI)
  await expect(page.getByText(/inventario|dashboard|ventas|compras/i)).toBeVisible();
});
