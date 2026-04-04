const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('ivp_session_active', '1');
  });
  await page.goto('/app.html?nosw=1');
});

test('navegación entre páginas activa secciones correctas', async ({ page }) => {
  await page.click('#nb-ot');
  await expect(page.locator('#page-ot')).toHaveClass(/active/);

  await page.click('#nb-instalaciones');
  await expect(page.locator('#page-instalaciones')).toHaveClass(/active/);

  await page.click('#nb-ajustes');
  await expect(page.locator('#page-ajustes')).toHaveClass(/active/);
});

test('validación de formulario muestra field errors', async ({ page }) => {
  await page.click('#nb-informes');
  await page.fill('#f-zona', '');
  await page.fill('#f-desc', '');
  await page.click('#btn-gen');

  await expect(page.locator('#f-zona')).toHaveClass(/field-invalid/);
  await expect(page.locator('#f-desc')).toHaveClass(/field-invalid/);
  await expect(page.locator('#err-card')).toContainText('Falta la descripción');
});

test('guardado OT e instalación aplican estado loading', async ({ page }) => {
  await page.evaluate(() => {
    const original = DB.save;
    DB.save = async (...args) => {
      await new Promise(r => setTimeout(r, 400));
      return original(...args);
    };
  });

  await page.click('#nb-ot');
  await page.click('button:has-text("Nueva OT")');
  await page.fill('#otf-title', 'Revisión bombas');
  await page.fill('#otf-fecha', '2026-04-04');
  await page.click('#btn-ot-save');
  await expect(page.locator('#btn-ot-save')).toHaveClass(/is-loading/);

  await page.click('#nb-instalaciones');
  await page.click('button:has-text("Nueva instalación")');
  await page.fill('#inst-nombre', 'Cuadro General Planta 2');
  await page.click('#inst-save-btn');
  await expect(page.locator('#inst-save-btn')).toHaveClass(/is-loading/);
});
