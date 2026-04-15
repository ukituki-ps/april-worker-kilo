package main

import (
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
	"github.com/ukituki-ps/april-worker/hub-bff/internal/observability"
)

func main() {
	slog.SetDefault(slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo})))

	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("load config: %v", err)
	}

	registry := prometheus.NewRegistry()
	observability.SetRecorder(observability.NewPrometheusRecorder(registry))

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

	mux := http.NewServeMux()
	mux.HandleFunc("/healthz", httpapi.Healthz)
	mux.HandleFunc("/readyz", httpapi.Readyz)
	mux.Handle("/metrics", promhttp.HandlerFor(registry, promhttp.HandlerOpts{}))
	mux.Handle(
		"/api/v1/overview",
		authMiddleware.Validate(auth.RequireAnyRole("user", "admin")(http.HandlerFunc(handlers.Overview))),
	)
	mux.Handle(
		"/api/v1/aggregation/dashboard",
		authMiddleware.Validate(auth.RequireAnyRole("user", "admin")(http.HandlerFunc(handlers.Dashboard))),
	)
	mux.Handle(
		"/api/v1/aggregation/home",
		authMiddleware.Validate(auth.RequireAnyRole("user", "admin")(http.HandlerFunc(handlers.Home))),
	)
	mux.Handle(
		"/api/v1/aggregation/summary",
		authMiddleware.Validate(auth.RequireAnyRole("user", "admin")(http.HandlerFunc(handlers.Summary))),
	)
	mux.Handle(
		"/api/v1/me",
		authMiddleware.Validate(auth.RequireAnyRole("user", "admin")(http.HandlerFunc(httpapi.Me))),
	)
	mux.Handle(
		"/api/v1/admin/ping",
		authMiddleware.Validate(auth.RequireAnyRole("admin")(http.HandlerFunc(httpapi.AdminPing))),
	)

	addr := ":" + cfg.Port
	log.Printf("hub-bff listening on %s", addr)
	handler := httpapi.CORS(cfg.CORSOrigins, httpapi.Metadata(httpapi.AccessLog(mux)))
	if err := http.ListenAndServe(addr, handler); err != nil {
		log.Fatalf("server stopped: %v", err)
	}
}
