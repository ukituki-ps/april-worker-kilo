package main

import (
	"context"
	"log"
	"log/slog"
	"net/http"
	"os"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"github.com/ukituki-ps/april-worker/hub-bff/internal/aggregation"
	"github.com/ukituki-ps/april-worker/hub-bff/internal/auth"
	"github.com/ukituki-ps/april-worker/hub-bff/internal/config"
	httpapi "github.com/ukituki-ps/april-worker/hub-bff/internal/http"
	"github.com/ukituki-ps/april-worker/hub-bff/internal/middleware"
	"github.com/ukituki-ps/april-worker/hub-bff/internal/observability"
	"github.com/ukituki-ps/april-worker/hub-bff/internal/redis"
)

func main() {
	slog.SetDefault(slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo})))

	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("load config: %v", err)
	}

	registry := prometheus.NewRegistry()
	observability.SetRecorder(observability.NewPrometheusRecorder(registry))

	redisClient, err := redis.New(context.Background(), cfg.RedisHost, cfg.RedisPort, cfg.RedisPassword)
	if err != nil {
		log.Fatalf("connect redis: %v", err)
	}
	defer redisClient.Close()

	authMiddleware, err := auth.NewMiddleware(cfg.KeycloakIssuer, cfg.KeycloakAud, cfg.KeycloakJWKS)
	if err != nil {
		log.Fatalf("init auth middleware: %v", err)
	}
	aggregationRuntime := aggregation.NewRuntime(&http.Client{}, aggregation.Options{
		Timeout: cfg.DownstreamTimeout,
		Retries: cfg.DownstreamRetries,
	}, map[string]string{
		"workflow": cfg.WorkflowURL,
		"nflow":    cfg.NFlowURL,
		"orgflow":  cfg.OrgFlowURL,
		"profil":   cfg.ProfilURL,
		"report":   cfg.ReportURL,
	})
	handlers := httpapi.NewHandlers(aggregationRuntime)
	profileAdminProxy, err := httpapi.NewProfileAdminProxy(cfg.ProfileAdminURL)
	if err != nil {
		log.Fatalf("init profile admin proxy: %v", err)
	}

	mux := http.NewServeMux()
	mux.Handle("/healthz", httpapi.AllowedMethods([]string{"GET"})(http.HandlerFunc(httpapi.Healthz)))
	mux.Handle("/readyz", httpapi.AllowedMethods([]string{"GET"})(http.HandlerFunc(httpapi.Readyz)))
	mux.Handle("/metrics", httpapi.AllowedMethods([]string{"GET"})(promhttp.HandlerFor(registry, promhttp.HandlerOpts{})))
	mux.Handle(
		"/api/v1/overview",
		httpapi.AllowedMethods([]string{"GET"})(
			authMiddleware.Validate(auth.RequireAnyRole("user", "admin")(http.HandlerFunc(handlers.Overview))),
		),
	)
	mux.Handle(
		"/api/v1/aggregation/dashboard",
		httpapi.AllowedMethods([]string{"GET"})(
			authMiddleware.Validate(auth.RequireAnyRole("user", "admin")(http.HandlerFunc(handlers.Dashboard))),
		),
	)
	mux.Handle(
		"/api/v1/aggregation/home",
		httpapi.AllowedMethods([]string{"GET"})(
			authMiddleware.Validate(auth.RequireAnyRole("user", "admin")(http.HandlerFunc(handlers.Home))),
		),
	)
	mux.Handle(
		"/api/v1/aggregation/summary",
		httpapi.AllowedMethods([]string{"GET"})(
			authMiddleware.Validate(auth.RequireAnyRole("user", "admin")(http.HandlerFunc(handlers.Summary))),
		),
	)
	mux.Handle(
		"/api/v1/me",
		httpapi.AllowedMethods([]string{"GET"})(
			authMiddleware.Validate(auth.RequireAnyRole("user", "admin")(http.HandlerFunc(httpapi.Me))),
		),
	)
	mux.Handle(
		"/api/v1/admin/ping",
		httpapi.AllowedMethods([]string{"GET"})(
			authMiddleware.Validate(auth.RequireAnyRole("admin")(http.HandlerFunc(httpapi.AdminPing))),
		),
	)
	mux.Handle(
		"/api/v1/admin/profile/",
		httpapi.AllowedMethods([]string{"GET", "PUT", "PATCH", "DELETE"})(
			authMiddleware.Validate(auth.RequireAnyRole("admin")(profileAdminProxy)),
		),
	)
	// CSP violation report endpoint — public, no auth required (browsers send reports unauthenticated)
	mux.Handle("/api/v1/csp-report", httpapi.AllowedMethods([]string{"POST"})(http.HandlerFunc(httpapi.CSReport)))

	// Cache middleware for read-only endpoints (inside auth to be user-aware)
	cacheCfg := &middleware.CacheConfig{
		TTLs:        middleware.DefaultTTLs(),
		RedisClient: redisClient,
		Enabled:     true,
	}
	rlCfg := &middleware.RateLimiterConfig{
		Tiers:       middleware.DefaultTiers(),
		RedisClient: redisClient,
	}
	handler := rlCfg.Middleware(
		cacheCfg.Middleware(
			httpapi.CORS(cfg.CORSOrigins, httpapi.Metadata(httpapi.AccessLog(mux))),
		),
	)

	addr := ":" + cfg.Port
	log.Printf("hub-bff listening on %s", addr)
	if err := http.ListenAndServe(addr, handler); err != nil {
		log.Fatalf("server stopped: %v", err)
	}
}
