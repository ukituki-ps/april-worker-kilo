# Задача 062: Shell Bundle Analysis

## Мета
- **ID / ветка:** `062-perf-shell-bundle-analysis`
- **Приоритет:** высокий (Phase 9 — Performance трек, нет зависимостей)
- **ADR:** [`docs/architecture/ADR-april-phase-9-security-and-performance.md`](../../docs/architecture/ADR-april-phase-9-security-and-performance.md)

## Цель
Провести анализ bundle size Hub Shell, внедрить code splitting и lazy loading для виджетов, задокументировать baseline и оптимизации.

## Контекст для агента
- Hub Shell: React + Vite + Mantine
- Widgets: ProfilesWidget, EntityTypesWidget — vendor'd из april-profile
- Bundle: Vite build produces `dist/` с JS/CSS chunks
- Mantine: CSS-in-JS framework, влияет на bundle size

## Входит в объём

### Bundle Analysis
- [ ] Запустить `npm run build` и проанализировать chunks
- [ ] Использовать `rollup-plugin-visualizer` или `vite-bundle-analyzer` для visual report
- [ ] Зафиксировать baseline bundle размер в `REPORT.md`
- [ ] Identify biggest dependencies: React, Mantine, Sentry, vendor'd widgets, @april/ui

### Code Splitting
- [ ] Lazy loading для всех виджетов:
  - `import ProfilesWidget from './widgets/ProfilesWidget'` → `React.lazy(() => import(...))`
  - `import EntityTypesWidget from './widgets/EntityTypesWidget'` → `React.lazy(() => import(...))`
- [ ] Suspense boundary для lazy-loaded виджетов с loading state
- [ ] Route-based code splitting для shell pages (если есть separate route chunks)
- [ ] `@april/ui`: dynamic import для используемых компонентов (не full bundle)

### Asset Optimization
- [ ] GZIP/Brotli compression в Nginx (если не configured)
- [ ] Vite build options: `build.minify: 'esbuild'`, `build.sourcemap: false` для production
- [ ] Preload critical assets: fonts, shell JS chunk

### Metrics
- [ ] Bundle budget:
  - Total JS: < 500KB gzipped (shell + inline widgets)
  - Initial load: < 200KB gzipped (critical path)
  - Widget chunks: < 100KB each (lazy loaded, не block initial paint)
- [ ] Performance metrics в CI: `vite-bundle-analyzer` на build, warn если > budget
- [ ] `npm scripts` additions:
  - `npm run build:analyze`
  - `npm run bundle:report`

### Documentation
- [ ] `docs/frontend/bundle-optimization.md` — baseline, changes, follow-up
- [ ] Lighthouse CI integration (optional): run lighthouse on built dist, report to CI

## Не входит в объём
- Tree shaking Mantine (Mantine сам tree-shakes, но CSS-in-JS — runtime cost)
- Service Worker / PWA caching (separate epic)
- Image optimization (нет images сейчас)
- Redesign components — только splitting

## Технические ограничения
- Vite: existing config, не ломать build
- React.lazy + Suspense — корректно работает с Mantine
- @april/ui: dynamic import possible, но нужно проверить что exports корректные

## Критерии готовности (acceptance)
- [ ] Bundle analysis report создан с визуализацией chunks
- [ ] Lazy loading для всех виджетов реализован
- [ ] Bundle size: initial < 200KB gzipped, total < 500KB gzipped
- [ ] `npm run build:analyze` script работает, output в CI
- [ ] Vite build passes, no runtime errors в lazy-loaded components
- [ ] Documentation `docs/frontend/bundle-optimization.md` создана

## Проверка
```bash
# Bundle analysis
cd hub-shell && npm run build
# Check dist/ size
du -sh hub-shell/dist/
# Run analyzer
cd hub-shell && npm run build:analyze

# Verify lazy loading works
# Dev mode: load shell, verify widgets load on demand (network tab)
# Production build: serve dist, verify chunk splitting

# Bundle budget check
cd hub-shell && npm run bundle:report
```

## Результат в отчёте
Bundle analysis diff, lazy loading implementation, chunk size report.
