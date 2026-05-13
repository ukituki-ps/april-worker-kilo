package middleware

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"strconv"
	"time"

	"github.com/ukituki-ps/april-worker/hub-bff/internal/auth"
	httpapi "github.com/ukituki-ps/april-worker/hub-bff/internal/http"
	"github.com/ukituki-ps/april-worker/hub-bff/internal/observability"
	hubredis "github.com/ukituki-ps/april-worker/hub-bff/internal/redis"
)

// Tier defines a rate limit rule for a path pattern.
type Tier struct {
	// Matches is the path prefix to match against (longest match wins).
	Matches string
	// Sensitive means use user identity (JWT subject) instead of IP.
	Sensitive bool
	// Limit is the max number of requests allowed in the window.
	Limit int
	// WindowSeconds is the sliding window size in seconds.
	WindowSeconds int
}

const rlPrefix = "hub_bff:rate:"

// slidingWindowLua atomically implements a sliding-window counter in Redis.
// KEYS[1] = sorted set key for the window
// ARGV[1] = window size in seconds
// ARGV[2] = current Unix timestamp (seconds)
// ARGV[3] = max allowed count (limit)
//
// Returns: { current_count, window_ttl_remaining }.
//
// The sorted set stores {score=timestamp, member=unique_id}. On each call it
// removes entries older than the window, counts remaining, and adds the new
// entry only if the count is still under the limit.
var slidingWindowLua = `
local key = KEYS[1]
local windowSec = tonumber(ARGV[1])
local nowSec = tonumber(ARGV[2])
local limit = tonumber(ARGV[3])

local windowStart = nowSec - windowSec
redis.call('ZREMRANGEBYSCORE', key, '-inf', '(' .. windowStart)

local current = redis.call('ZCARD', key)

if current < limit then
    redis.call('ZADD', key, nowSec, tostring(nowSec * 1000000 + math.random(1000000)))
    redis.call('EXPIRE', key, windowSec + 1)
end

return { redis.call('ZCARD', key), windowSec }
`

// RateLimiterConfig holds the Redis-backed rate limiter settings.
type RateLimiterConfig struct {
	// Tiers define rate limits per path pattern (longest match wins).
	Tiers []Tier
	// RedisClient is the Redis connection used for distributed counters.
	RedisClient *hubredis.Client
}

// Middleware returns an http.Handler that enforces rate limits before delegating to next.
func (cfg *RateLimiterConfig) Middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		tier := ResolveTier(r.URL.Path, cfg.Tiers)
		if tier == nil {
			next.ServeHTTP(w, r)
			return
		}

		identifier := r.RemoteAddr
		tenantID := "anon"
		if tier.Sensitive {
			if claims, ok := auth.ClaimsFromContext(r.Context()); ok {
				identifier = claims.Subject
				tenantID = claims.TenantID
			}
		}

		key := fmt.Sprintf("%s%s:%s:%s", rlPrefix, tier.Matches, tenantID, identifier)
		nowSec := time.Now().Unix()

		allowed, remaining, limit, retryAfter := cfg.allowWithEval(r.Context(), key, tier.Limit, tier.WindowSeconds, nowSec)

		if !allowed {
			md := httpapi.MetadataFromContext(r.Context())
			slog.Warn("hub-bff rate limit exceeded",
				"event",         "rate_limited",
				"path",          r.URL.Path,
				"method",        r.Method,
				"limit",         limit,
				"retryAfter",    retryAfter,
				"correlationId", md.CorrelationID,
				"requestId",     md.RequestID,
				"sourceService", "hub-bff",
			)
			observability.ObserveRateLimited(r.URL.Path, "rate_limit_exceeded")
			writeTooManyRequests(w, retryAfter)
			return
		}

		RateLimitHeaders(w, limit, remaining)
		next.ServeHTTP(w, r)
	})
}

// allowWithEval sends the sliding window Lua script to Redis.
func (cfg *RateLimiterConfig) allowWithEval(ctx context.Context, key string, limit int, windowSec int, nowSec int64) (bool, int, int, int64) {
	result, err := cfg.RedisClient.Eval(ctx, slidingWindowLua, []string{key}, windowSec, nowSec, limit).Result()
	if err != nil {
		// Fail-open: if Redis is unavailable, allow the request.
		slog.Error("hub-bff redis unavailable, failing open",
			"error", err,
			"path", key,
		)
		return true, limit, limit, 0
	}

	var currentCount int
	if arr, ok := result.([]interface{}); ok && len(arr) >= 2 {
		currentCount = safeInt(arr[0])
	}

	if currentCount >= limit {
		return false, 0, limit, int64(windowSec)
	}
	remaining := limit - currentCount
	if remaining < 0 {
		remaining = 0
	}
	return true, remaining, limit, 0
}

// DefaultTiers returns the default rate limit tiers for AprilHub BFF.
func DefaultTiers() []Tier {
	return []Tier{
		{Matches: "/api/v1/me", Sensitive: true, Limit: 10, WindowSeconds: 60},
		{Matches: "/api/v1/admin", Sensitive: true, Limit: 10, WindowSeconds: 60},
		{Matches: "/api/v1/aggregation", Sensitive: false, Limit: 100, WindowSeconds: 60},
		{Matches: "/api/v1/overview", Sensitive: false, Limit: 100, WindowSeconds: 60},
	}
}

// ResolveTier finds the best matching tier for the request path.
// Returns nil for paths without a rate limit (e.g. /healthz, /readyz, /metrics).
func ResolveTier(path string, tiers []Tier) *Tier {
	best := Tier{}
	bestLen := 0
	for _, t := range tiers {
		if pathMatches(path, t.Matches) && len(t.Matches) > bestLen {
			best = t
			bestLen = len(t.Matches)
		}
	}
	if bestLen == 0 {
		return nil
	}
	return &best
}

// pathMatches checks if the request path begins with the given pattern.
func pathMatches(path, pattern string) bool {
	return len(path) >= len(pattern) && path[:len(pattern)] == pattern
}

// RateLimitHeaders sets standard rate-limit response headers.
func RateLimitHeaders(w http.ResponseWriter, limit, remaining int) {
	w.Header().Set("X-RateLimit-Limit", strconv.Itoa(limit))
	w.Header().Set("X-RateLimit-Remaining", strconv.Itoa(remaining))
}

func writeTooManyRequests(w http.ResponseWriter, retryAfter int64) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Retry-After", strconv.FormatInt(retryAfter, 10))
	w.WriteHeader(http.StatusTooManyRequests)
	_ = json.NewEncoder(w).Encode(map[string]any{
		"code":    "rate_limit_exceeded",
		"message": "слишком много запросов, попробуйте позже",
		"metadata": map[string]any{
			"retryAfter": retryAfter,
		},
	})
}

// safeInt converts a Redis result value to int.
func safeInt(v interface{}) int {
	switch val := v.(type) {
	case int64:
		return int(val)
	case float64:
		return int(val)
	case string:
		n, err := strconv.Atoi(val)
		if err != nil {
			return 0
		}
		return n
	}
	return 0
}
