#!/usr/bin/env bash
# Применить на хосте внешнего nginx (pr01 / 192.168.1.29): Upgrade→Vite HMR для https://dev.april.ukituki.tech/
# Требует root: sudo ./scripts/apply-edge-nginx-websocket-april-dev.sh
#
# Делает:
#  - /etc/nginx/conf.d/10-map-websocket-upgrade.conf (map $connection_upgrade)
#  - правит единственный proxy_pass на 192.168.1.42:8080 в sites-enabled/space.conf
set -euo pipefail

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Запуск: sudo $0" >&2
  exit 1
fi

MAP_FILE=/etc/nginx/conf.d/10-map-websocket-upgrade.conf
cat <<'EOF' >"$MAP_FILE"
# April dev: поддержка Upgrade для Vite HMR (websocket) за HTTPS.
map $http_upgrade $connection_upgrade {
    default upgrade;
    ''      close;
}
EOF

SITE_GLOB=/etc/nginx/sites-enabled/space.conf
if [[ ! -f "$SITE_GLOB" ]]; then
  echo "нет файла $SITE_GLOB — поправьте путь скрипта" >&2
  exit 1
fi

python3 <<'PY'
from pathlib import Path
path = Path("/etc/nginx/sites-enabled/space.conf")
text = path.read_text(encoding="utf-8")
before = """    location / {
        proxy_pass http://192.168.1.42:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }"""
after = """    location / {
        proxy_http_version 1.1;
        proxy_pass http://192.168.1.42:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_read_timeout 86400;
    }"""
if before not in text:
    if "proxy_set_header Connection $connection_upgrade" in text and "192.168.1.42:8080" in text:
        print("[apply-edge-nginx] space.conf уже содержит патч websocket — пропуск замены блока.")
    else:
        raise SystemExit(f"[apply-edge-nginx] образец блока для dev.april не найден в {path}")
else:
    path.write_text(text.replace(before, after, 1), encoding="utf-8")
    print("[apply-edge-nginx] обновлён блок location / для proxy_pass …:8080")
PY

nginx -t
systemctl reload nginx
echo "[apply-edge-nginx] nginx -t OK, reload выполнен."
