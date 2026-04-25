#!/usr/bin/env sh
# Разрешает произвольные user attributes (например `tenant_id` для mappers) в Keycloak 24+.
# Выполнять в окружении, где kcadm уже нацелен на кластер (см. docker exec keycloak + config credentials).
set -euo pipefail
REALM="${1:-april}"
TMP="$(mktemp)"
${KCADM_KCADM:-/opt/keycloak/bin/kcadm.sh} get "users/profile" -r "$REALM" | python3 -c "import json,sys; p=json.load(sys.stdin); p['unmanagedAttributePolicy']='ENABLED'; print(json.dumps(p))" >"$TMP"
${KCADM_KCADM:-/opt/keycloak/bin/kcadm.sh} update "users/profile" -r "$REALM" -f "$TMP"
rm -f "$TMP"
echo "users/profile: unmanagedAttributePolicy=ENABLED for realm=$REALM"
