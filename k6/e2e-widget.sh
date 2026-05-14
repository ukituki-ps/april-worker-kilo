#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:18081}"
TOKEN="${AUTH_TOKEN:-}"

if [ -z "$TOKEN" ]; then
  echo "ERROR: AUTH_TOKEN is required"
  exit 1
fi

PASS=0
FAIL=0
TOTAL=0

# ── Aggregation endpoints: status code checks ──

echo "\n=== Aggregation Endpoints ==="

for route in dashboard home summary; do
  FULL="${BASE_URL}/api/v1/aggregation/${route}"
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Authorization: Bearer ${TOKEN}" "$FULL")
  TOTAL=$((TOTAL + 1))
  if [ "$STATUS" -eq 200 ]; then
    echo "PASS  [200] aggregation/${route}"
    PASS=$((PASS + 1))
  else
    echo "FAIL  [${STATUS}] aggregation/${route} — expected 200"
    FAIL=$((FAIL + 1))
  fi
done

# ── Aggregation endpoints: response structure ──

echo "\n=== Response Structure ==="

for route in dashboard home summary; do
  FULL="${BASE_URL}/api/v1/aggregation/${route}"
  BODY=$(curl -s \
    -H "Authorization: Bearer ${TOKEN}" "$FULL")

  echo "--- aggregation/${route} ---"

  S=$(echo "$BODY" | jq -r '.status // empty' 2>/dev/null || true)
  TOTAL=$((TOTAL + 1))
  if [ "$S" = "ok" ] || [ "$S" = "degraded" ]; then
    echo "PASS  status: $S"
    PASS=$((PASS + 1))
  else
    echo "FAIL  status: ${S:-(empty)}"
    FAIL=$((FAIL + 1))
  fi

  D=$(echo "$BODY" | jq 'has("data")' 2>/dev/null || true)
  TOTAL=$((TOTAL + 1))
  if [ "$D" = "true" ]; then
    echo "PASS  has data field"
    PASS=$((PASS + 1))
  else
    echo "FAIL  missing data field"
    FAIL=$((FAIL + 1))
  fi

  M=$(echo "$BODY" | jq 'has("metadata") and (.metadata | has("correlationId") and has("requestId") and has("sourceService"))' 2>/dev/null || true)
  TOTAL=$((TOTAL + 1))
  if [ "$M" = "true" ]; then
    echo "PASS  metadata valid"
    PASS=$((PASS + 1))
  else
    echo "FAIL  metadata invalid"
    FAIL=$((FAIL + 1))
  fi

  T=$(echo "$BODY" | jq 'if has("degraded") then (.degraded | type) else "missing" end' 2>/dev/null || true)
  TOTAL=$((TOTAL + 1))
  if [ "$T" = '"array"' ]; then
    echo "PASS  degraded is array"
    PASS=$((PASS + 1))
  else
    echo "FAIL  degraded type: $T"
    FAIL=$((FAIL + 1))
  fi
done

# ── CSP report endpoint ──

echo "\n=== CSP Report Endpoint ==="

S=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
  -H "Content-Type: application/json" \
  -d '{"csp-report":{"document-uri":"http://localhost","blocked-uri":"http://x","violated-directive":"default-src","disposition":"enforce"}}' \
  "${BASE_URL}/api/v1/csp-report")
TOTAL=$((TOTAL + 1))
if [ "$S" -eq 202 ]; then
  echo "PASS  POST csp-report → 202"
  PASS=$((PASS + 1))
else
  echo "FAIL  POST csp-report → ${S} (expected 202)"
  FAIL=$((FAIL + 1))
fi

S=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
  -H "Content-Type: application/json" \
  -d 'bad' \
  "${BASE_URL}/api/v1/csp-report")
TOTAL=$((TOTAL + 1))
if [ "$S" -eq 400 ]; then
  echo "PASS  POST csp-report bad body → 400"
  PASS=$((PASS + 1))
else
  echo "FAIL  POST csp-report bad body → ${S} (expected 400)"
  FAIL=$((FAIL + 1))
fi

S=$(curl -s -o /dev/null -w "%{http_code}" \
  "${BASE_URL}/api/v1/csp-report")
TOTAL=$((TOTAL + 1))
if [ "$S" -eq 405 ]; then
  echo "PASS  GET csp-report → 405"
  PASS=$((PASS + 1))
else
  echo "FAIL  GET csp-report → ${S} (expected 405)"
  FAIL=$((FAIL + 1))
fi

# ── Summary ──

echo "\n====== Results: ${PASS}/${TOTAL} passed, ${FAIL} failed ======"

[ "$FAIL" -eq 0 ]