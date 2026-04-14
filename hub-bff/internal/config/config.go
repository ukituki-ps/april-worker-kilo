package config

import (
	"fmt"
	"os"
)

type Config struct {
	Port         string
	KeycloakURL  string
	KeycloakRealm string
	KeycloakJWKS string
	KeycloakIssuer string
	KeycloakAud  string
}

func Load() (Config, error) {
	cfg := Config{
		Port:          getEnv("HUB_BFF_PORT", "8081"),
		KeycloakURL:   os.Getenv("KEYCLOAK_URL"),
		KeycloakRealm: os.Getenv("KEYCLOAK_REALM"),
		KeycloakJWKS:  os.Getenv("KEYCLOAK_JWKS_URL"),
		KeycloakIssuer: os.Getenv("KEYCLOAK_ISSUER"),
		KeycloakAud:   os.Getenv("KEYCLOAK_AUDIENCE"),
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

func getEnv(name, fallback string) string {
	if value := os.Getenv(name); value != "" {
		return value
	}
	return fallback
}
