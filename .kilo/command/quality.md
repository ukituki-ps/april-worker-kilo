---
description: Run the AprilHub quality gate (lint + tests + build)
---
Run the mandatory quality gate for AprilHub (from README.md).

Execute (in order, stop on first failure):
1. `make openapi-lint`
2. `cd hub-bff && go test ./...` (if hub-bff has Go code)
3. `cd hub-shell && npm run lint`
4. `cd hub-shell && npm test`
5. `cd hub-shell && npm run build`

If any step fails: fix the failures. Re-run the full pipeline until all pass.
Report final status: PASS or FAIL with summary of each step.