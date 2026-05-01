# 051 — dev: постоянная перезагрузка hub-shell на dev.april.ukituki.tech

## Цель

Выяснить причину непрерывных full reload в браузере на `https://dev.april.ukituki.tech/` и убрать цикл без потери возможности эксплуатации стенда.

## Критерии приёмки

- Зафиксирован root cause с доказательством из консоли браузера.
- Доставлен минимальный механизм обхода (env) и описана инфраструктурная корневая правка для edge-nginx.
- `REPORT.md` по [`docs/AGENT_REPORT_TEMPLATE.md`](../../docs/AGENT_REPORT_TEMPLATE.md) и triage-блок из [`docs/AGENT_ERROR_TRIAGE_PROMPT.md`](../../docs/AGENT_ERROR_TRIAGE_PROMPT.md).
