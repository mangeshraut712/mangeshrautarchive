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

- [ ] Lint and format pass (`npm run check`)
- [ ] API, Worker, unit, and critical browser tests pass (`npm test`)
- [ ] Tester Army desktop journeys pass (`npm run test:tester-army:ci`)
- [ ] Production build passes (`npm run build`)
- [ ] Lighthouse (when performance-sensitive): `npm run qa:lighthouse:desktop`

## Deploy impact

- [ ] No deployment behavior change
- [ ] Touches static `src/` → verify GitHub Pages and its deployed commit
- [ ] Touches `workers/assistme-chat/` → verify the Worker workflow and affected API behavior
- [ ] Touches `api/` → verify FastAPI locally; test Vercel only if that optional deployment is enabled
- [ ] Touches CI / Pages only → check Actions → **CI → Deploy to GitHub Pages**

## Checklist

- [ ] Code style: ESLint, Stylelint, Oxlint, Prettier (`npm run check`)
- [ ] `npm run security-check` clean
- [ ] No inline styles or Tailwind utility classes in HTML
- [ ] No `.env` files or secrets committed
- [ ] No `<footer>` on `systems.html` / `monitor.html`
- [ ] ES module imports include the `.js` extension
- [ ] Bumped `ASSET_VER` / `?v=` when shipping CSS/JS cache-sensitive changes

- [ ] Changelog, README attribution, and affected docs updated
- [ ] UI changes inspected on mobile and desktop in light and dark themes
- [ ] After merge: applicable Actions green, CodeQL configuration healthy, and relevant alerts resolved
