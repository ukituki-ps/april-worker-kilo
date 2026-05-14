package main

import (
	"context"
	"log"
	"log/slog"
	"net/http"
	"os"
	"time"

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

	authMiddleware, err := auth.NewMiddleware(cfg.KeycloakIssuer, cfg.KeycloakAud, cfg.KeycloakJWKS)
	if err != nil {
		redisClient.Close()
		log.Fatalf("init auth middleware: %v", err)
	}

	if err := run(cfg, redisClient, authMiddleware, registry); err != nil {
		redisClient.Close()
		log.Fatalf("server: %v", err)
	}
}

func run(cfg config.Config, rc *redis.Client, am *auth.Middleware, reg *prometheus.Registry) error {
	pap, err := httpapi.NewProfileAdminProxy(cfg.ProfileAdminURL)
	if err != nil {
		return err
	}

	agg := aggregation.NewRuntime(&http.Client{}, aggregation.Options{
		Timeout: cfg.DownstreamTimeout,
		Retries: cfg.DownstreamRetries,
	}, map[string]string{
		"workflow": cfg.WorkflowURL,
		"nflow":    cfg.NFlowURL,
		"orgflow":  cfg.OrgFlowURL,
		"profil":   cfg.ProfilURL,
		"report":   cfg.ReportURL,
	})
	handlers := httpapi.NewHandlers(agg)
	health := httpapi.NewHealth(rc)

	mux := http.NewServeMux()
	mux.Handle("/healthz", httpapi.AllowedMethods([]string{"GET"})(http.HandlerFunc(health.Healthz)))
	mux.Handle("/livez", httpapi.AllowedMethods([]string{"GET"})(http.HandlerFunc(health.Livez)))
	mux.Handle("/readyz", httpapi.AllowedMethods([]string{"GET"})(http.HandlerFunc(health.Readyz)))
	mux.Handle("/metrics", httpapi.AllowedMethods([]string{"GET"})(promhttp.HandlerFor(reg, promhttp.HandlerOpts{})))
	mux.Handle(
		"/api/v1/overview",
		httpapi.AllowedMethods([]string{"GET"})(
			am.Validate(auth.RequireAnyRole("user", "admin")(http.HandlerFunc(handlers.Overview))),
		),
	)
	mux.Handle(
		"/api/v1/aggregation/dashboard",
		httpapi.AllowedMethods([]string{"GET"})(
			am.Validate(auth.RequireAnyRole("user", "admin")(http.HandlerFunc(handlers.Dashboard))),
		),
	)
	mux.Handle(
		"/api/v1/aggregation/home",
		httpapi.AllowedMethods([]string{"GET"})(
			am.Validate(auth.RequireAnyRole("user", "admin")(http.HandlerFunc(handlers.Home))),
		),
	)
	mux.Handle(
		"/api/v1/aggregation/summary",
		httpapi.AllowedMethods([]string{"GET"})(
			am.Validate(auth.RequireAnyRole("user", "admin")(http.HandlerFunc(handlers.Summary))),
		),
	)
	mux.Handle(
		"/api/v1/me",
		httpapi.AllowedMethods([]string{"GET"})(
			am.Validate(auth.RequireAnyRole("user", "admin")(http.HandlerFunc(httpapi.Me))),
		),
	)
	mux.Handle(
		"/api/v1/admin/ping",
		httpapi.AllowedMethods([]string{"GET"})(
			am.Validate(auth.RequireAnyRole("admin")(http.HandlerFunc(httpapi.AdminPing))),
		),
	)
	mux.Handle(
		"/api/v1/admin/profile/",
		httpapi.AllowedMethods([]string{"GET", "PUT", "PATCH", "DELETE"})(
			am.Validate(auth.RequireAnyRole("admin")(pap)),
		),
	)
	mux.Handle("/api/v1/csp-report", httpapi.AllowedMethods([]string{"POST"})(http.HandlerFunc(httpapi.CSReport)))

	cacheCfg := &middleware.CacheConfig{
		TTLs:        middleware.DefaultTTLs(),
		RedisClient: rc,
		Enabled:     true,
	}
	rlCfg := &middleware.RateLimiterConfig{
		Tiers:       middleware.DefaultTiers(),
		RedisClient: rc,
	}
	handler := rlCfg.Middleware(
		cacheCfg.Middleware(
			httpapi.CORS(cfg.CORSOrigins, httpapi.Metadata(httpapi.AccessLog(mux))),
		),
	)

	addr := ":" + cfg.Port
	srv := &http.Server{
		Addr:         addr,
		Handler:      handler,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}
	log.Printf("hub-bff listening on %s", addr)
	return srv.ListenAndServe()
}
