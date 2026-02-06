import { test, expect } from "@playwright/test";

test("Admin: entra ya logueado y ve el menú principal", async ({ page }) => {
  await page.goto("/home");

  // espera a que el menú cargue
  await expect(page.getByRole("heading", { name: /menú/i })).toBeVisible();

  // valida una tarjeta clave
  await expect(page.getByRole("heading", { name: "Inventario" })).toBeVisible();
});