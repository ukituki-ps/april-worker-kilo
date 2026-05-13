# --------------------------------------------------------------------------
# Stage 1: Build
# Копируем модуль, кэшируем зависимости, компилируем static binary.
# CGO_ENABLED=0 — все production-зависимости pure Go (testcontainers/lib/pq
# используются только в integration-тестах и не попадают в бинарник).
# --------------------------------------------------------------------------
FROM golang:1.24-alpine AS builder

WORKDIR /src

# Кэширующий слой: go.mod + go.sum загружаются до копирования исходников.
# Последующие build-команды пропустят `go mod download`, если модули не менялись.
COPY go.mod go.sum ./
RUN --mount=type=cache,target=/root/.cache/go-build \
    --mount=type=cache,target=/go/pkg/mod \
    go mod download

COPY . .

# Static binary — без CGO, все символы в одном файле.
RUN --mount=type=cache,target=/root/.cache/go-build \
    --mount=type=cache,target=/go/pkg/mod \
    CGO_ENABLED=0 go build \
      -trimpath \
      -ldflags="-s -w" \
      -o /out/hub-bff \
      ./cmd/hub-bff

# --------------------------------------------------------------------------
# Stage 2: Production
# Минимальный runtime image: Alpine + ca-certificates + non-root user.
# ENV-переменные (KEYCLOAK_*, HUB_BFF_PORT и т.д.) задаются при запуске.
# --------------------------------------------------------------------------
FROM alpine:3.20

RUN apk add --no-cache ca-certificates wget

# Non-root user для запуска
RUN addgroup -g 1001 -S appgroup && \
    adduser  -u 1001 -S appuser -G appgroup

WORKDIR /app

COPY --from=builder /out/hub-bff .

USER appuser

EXPOSE 8081

# Healthcheck — быстрый GET на /healthz (см. main.go, строка 50).
HEALTHCHECK --interval=15s --timeout=5s --retries=3 --start-period=5s \
  CMD wget -q -O /dev/null http://localhost:8081/healthz || exit 1

ENTRYPOINT ["/app/hub-bff"]
