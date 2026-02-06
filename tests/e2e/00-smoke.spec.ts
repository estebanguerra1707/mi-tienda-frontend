import { test, expect } from "@playwright/test";

test("Smoke: abre la app y muestra login", async ({ page }) => {
  await page.goto("/login");

  // Ajusta el texto según tu UI real:
  // Puede ser "Iniciar sesión", "Login", etc.
  await expect(page).toHaveURL(/\/login/);

  // Si tienes un título o botón típico de login, valida uno:
  await expect(
    page.getByRole("button", { name: /iniciar|login|entrar/i })
  ).toBeVisible();
});