## Description

<!-- Brief description of the changes. What does this PR do and why? -->

## Type of Change

- [ ] 🐛 Bug fix (non-breaking change that fixes an issue)
- [ ] ✨ New feature (non-breaking change that adds functionality)
- [ ] 💥 Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] 📝 Documentation update
- [ ] 🎨 Style / UI update
- [ ] ♻️ Refactor (no functional changes)
- [ ] ⚡ Performance improvement
- [ ] 🔒 Security fix

## Testing

<!-- Describe the tests you ran and how to reproduce them. -->

- [ ] Unit tests pass (`npm test` / `npm run check`)
- [ ] API tests pass (`npm run test:api`)
- [ ] E2E smoke (when UI changes): `npm run test:e2e:chrome`
- [ ] Lighthouse (when performance-sensitive): `npm run qa:lighthouse:desktop`

## Deploy impact

- [ ] No change to dual-host surfaces
- [ ] Touches static `src/` → Vercel + GitHub Pages will both rebuild
- [ ] Touches `api/` or `vercel.json` → verify `https://mangeshraut.pro/api/health`
- [ ] Touches CI / Pages only → check Actions → **CI → Deploy to GitHub Pages**

## Checklist

- [ ] Code style: ESLint, Stylelint, Prettier (`npm run check`)
- [ ] `npm run security-check` clean
- [ ] No inline styles or Tailwind utility classes in HTML
- [ ] No `.env` files or secrets committed
- [ ] No `<footer>` on `systems.html` / `monitor.html`
- [ ] ES module imports include the `.js` extension
- [ ] Bumped `ASSET_VER` / `?v=` when shipping CSS/JS cache-sensitive changes
