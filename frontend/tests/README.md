# Smoke tests

Renders every page against the live Flask API in jsdom (no browser needed).

```bash
cd backend && python app.py            # terminal 1
cd frontend && npm i -D vitest jsdom @testing-library/react && npx vitest run tests/smoke.test.jsx
```

Leaflet's canvas renderer is not fully supported by jsdom, so the map tabs can emit "unhandled error" noise or make the
App-shell test flaky when the whole file is run together (it passes when run alone). These tests check that the pages mount and
show data; they do not check visual appearance.
