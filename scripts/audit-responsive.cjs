/* eslint-disable */
// Audit responsive de Label Tycoon : débordement horizontal et cibles tactiles de moins de 44 px,
// sur chaque écran du jeu, à 360, 768, 1280 et 1920 px.
// Usage : pnpm --filter @tycoon/web build && pnpm --filter @tycoon/web preview --port 4173,
// puis node scripts/audit-responsive.cjs (PLAYWRIGHT_MODULE, CHROMIUM_PATH et BASE_URL réglables).
// Le script affiche la liste des problèmes par largeur ; une liste vide est le but.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
(async () => {
  const b = await chromium.launch({
    ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}),
  });
  const out = {};
  for (const [w, h] of [
    [360, 740],
    [768, 1024],
    [1280, 800],
    [1920, 1080],
  ]) {
    const ctx = await b.newContext({
      viewport: { width: w, height: h },
      hasTouch: w < 1000,
      reducedMotion: 'reduce',
    });
    const p = await ctx.newPage();
    await p.goto((process.env.BASE_URL || 'http://localhost:4173') + '/label');
    await p.getByRole('button', { name: 'Nouvelle partie' }).waitFor();
    await p.waitForFunction(() => !document.querySelector('button')?.disabled || true);
    await p.waitForTimeout(500);
    await p.getByRole('button', { name: 'Nouvelle partie' }).click();
    const nav = p.getByRole('navigation', { name: 'Écrans du jeu' });
    await nav.waitFor();
    const noms = await nav.getByRole('button').allInnerTexts();
    const problems = [];
    for (let i = 0; i < noms.length; i++) {
      const menu = p.getByRole('button', { name: /^Menu/ });
      if (await menu.count()) await menu.click();
      await nav.getByRole('button').nth(i).click();
      await p.waitForTimeout(500);
      const r = await p.evaluate(() => {
        const over = document.documentElement.scrollWidth - window.innerWidth;
        const petits = [];
        for (const el of document.querySelectorAll(
          'button, a[href], input, select, summary, [role=button], [role=tab]',
        )) {
          const r = el.getBoundingClientRect();
          if (r.width === 0 || r.height === 0) continue;
          if (el.type === 'hidden') continue;
          if (
            el.type === 'checkbox' || el.type === 'radio'
              ? r.width < 24 || r.height < 24
              : r.width < 44 || r.height < 44
          )
            petits.push(
              (el.textContent || el.getAttribute('aria-label') || el.name || el.tagName)
                .trim()
                .slice(0, 30) + ` ${Math.round(r.width)}x${Math.round(r.height)}`,
            );
        }
        return { over, petits };
      });
      if (r.over > 0) problems.push(`${noms[i].split('\n')[0]}: débordement ${r.over}px`);
      if (w <= 768 && r.petits.length)
        problems.push(
          `${noms[i].split('\n')[0]}: ${r.petits.length} cibles <44px: ${r.petits.slice(0, 4).join(' | ')}`,
        );
    }
    out[w] = problems;
    await ctx.close();
  }
  console.log(JSON.stringify(out, null, 1));
  await b.close();
})();
