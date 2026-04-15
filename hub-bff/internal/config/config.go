package config

import (
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"
)

type Config struct {
	Port              string
	KeycloakURL       string
	KeycloakRealm     string
	KeycloakJWKS      string
	KeycloakIssuer    string
	KeycloakAud       string
	CORSOrigins       []string
	DownstreamTimeout time.Duration
	DownstreamRetries int
	WorkflowURL       string
	NFlowURL          string
	OrgFlowURL        string
	ProfilURL         string
	ReportURL         string
}

func Load() (Config, error) {
	cfg := Config{
		Port:              getEnv("HUB_BFF_PORT", "8081"),
		KeycloakURL:       os.Getenv("KEYCLOAK_URL"),
		KeycloakRealm:     os.Getenv("KEYCLOAK_REALM"),
		KeycloakJWKS:      os.Getenv("KEYCLOAK_JWKS_URL"),
		KeycloakIssuer:    os.Getenv("KEYCLOAK_ISSUER"),
		KeycloakAud:       os.Getenv("KEYCLOAK_AUDIENCE"),
		CORSOrigins:       parseCSV(getEnv("HUB_BFF_CORS_ORIGINS", "http://localhost:4173,http://127.0.0.1:4173")),
		DownstreamTimeout: parseDuration(getEnv("HUB_BFF_DOWNSTREAM_TIMEOUT", "2s"), 2*time.Second),
		DownstreamRetries: parseInt(getEnv("HUB_BFF_DOWNSTREAM_RETRIES", "1"), 1),
		WorkflowURL:       os.Getenv("APRIL_WORKFLOW_URL"),
		NFlowURL:          os.Getenv("APRIL_NFLOW_URL"),
		OrgFlowURL:        os.Getenv("APRIL_ORGFLOW_URL"),
		ProfilURL:         os.Getenv("APRIL_PROFIL_URL"),
		ReportURL:         os.Getenv("APRIL_REPORT_URL"),
	}
	if cfg.KeycloakURL == "" || cfg.KeycloakRealm == "" {
		return Config{}, fmt.Errorf("KEYCLOAK_URL and KEYCLOAK_REALM are required")
	}
	if cfg.KeycloakJWKS == "" {
		cfg.KeycloakJWKS = fmt.Sprintf("%s/realms/%s/protocol/openid-connect/certs", cfg.KeycloakURL, cfg.KeycloakRealm)
	}
	if cfg.KeycloakIssuer == "" {
		cfg.KeycloakIssuer = fmt.Sprintf("%s/realms/%s", cfg.KeycloakURL, cfg.KeycloakRealm)
	}
	return cfg, nil
}

func parseDuration(value string, fallback time.Duration) time.Duration {
	parsed, err := time.ParseDuration(value)
	if err != nil {
		return fallback
	}
	return parsed
}

func parseInt(value string, fallback int) int {
	parsed, err := strconv.Atoi(value)
	if err != nil {
		return fallback
	}
	return parsed
}

func getEnv(name, fallback string) string {
	if value := os.Getenv(name); value != "" {
		return value
	}
	return fallback
}

func parseCSV(value string) []string {
	parts := strings.Split(value, ",")
	out := make([]string, 0, len(parts))
	for _, part := range parts {
		trimmed := strings.TrimSpace(part)
		if trimmed != "" {
			out = append(out, trimmed)
		}
	}
	return out
}
