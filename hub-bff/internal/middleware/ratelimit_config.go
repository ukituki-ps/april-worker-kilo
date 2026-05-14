package middleware

import (
	"os"
	"strconv"
	"strings"
)

const (
	envTierGeneral   = "RATE_LIMIT_TIER_GENERAL"
	envTierSensitive = "RATE_LIMIT_TIER_SENSITIVE"
)

// parseTierValue parses a "requests:window_seconds" string into (limit, windowSeconds).
// Returns (0, 0) if the format is invalid.
func parseTierValue(s string) (int, int) {
	parts := strings.Split(strings.TrimSpace(s), ":")
	if len(parts) != 2 {
		return 0, 0
	}
	req, err1 := strconv.Atoi(strings.TrimSpace(parts[0]))
	win, err2 := strconv.Atoi(strings.TrimSpace(parts[1]))
	if err1 != nil || err2 != nil {
		return 0, 0
	}
	return req, win
}

// DefaultTiers returns the default rate limit tiers for AprilHub BFF.
// Env vars RATE_LIMIT_TIER_GENERAL and RATE_LIMIT_TIER_SENSITIVE override the
// default limits. Format: "requests:window_seconds" (e.g., "60:60").
func DefaultTiers() []Tier {
	generalReq, generalWin := parseTierValue(os.Getenv(envTierGeneral))
	sensitiveReq, sensitiveWin := parseTierValue(os.Getenv(envTierSensitive))

	// Fallback defaults
	if generalReq == 0 || generalWin == 0 {
		generalReq, generalWin = 100, 60
	}
	if sensitiveReq == 0 || sensitiveWin == 0 {
		sensitiveReq, sensitiveWin = 10, 60
	}

	return []Tier{
		{Matches: "/api/v1/me", Sensitive: true, Limit: sensitiveReq, WindowSeconds: sensitiveWin},
		{Matches: "/api/v1/admin", Sensitive: true, Limit: sensitiveReq, WindowSeconds: sensitiveWin},
		{Matches: "/api/v1/csp-report", Sensitive: false, Limit: 30, WindowSeconds: 60},
		{Matches: "/api/v1/aggregation", Sensitive: false, Limit: generalReq, WindowSeconds: generalWin},
		{Matches: "/api/v1/overview", Sensitive: false, Limit: generalReq, WindowSeconds: generalWin},
	}
}
