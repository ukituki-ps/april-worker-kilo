package main

import (
	"log"
	"net/http"

	"github.com/ukituki-ps/april-worker/hub-bff/internal/auth"
	"github.com/ukituki-ps/april-worker/hub-bff/internal/config"
	httpapi "github.com/ukituki-ps/april-worker/hub-bff/internal/http"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("load config: %v", err)
	}

	authMiddleware, err := auth.NewMiddleware(cfg.KeycloakIssuer, cfg.KeycloakAud, cfg.KeycloakJWKS)
	if err != nil {
		log.Fatalf("init auth middleware: %v", err)
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/healthz", httpapi.Healthz)
	mux.HandleFunc("/readyz", httpapi.Readyz)
	mux.Handle(
		"/api/v1/overview",
		authMiddleware.Validate(auth.RequireAnyRole("user", "admin")(http.HandlerFunc(httpapi.Overview))),
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
	if err := http.ListenAndServe(addr, mux); err != nil {
		log.Fatalf("server stopped: %v", err)
	}
}
