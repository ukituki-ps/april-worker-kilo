package middleware

import (
	"context"
	"log/slog"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/ukituki-ps/april-worker/hub-bff/internal/auth"
	"github.com/ukituki-ps/april-worker/hub-bff/internal/observability"
	"github.com/ukituki-ps/april-worker/hub-bff/internal/redis"
)

const cachePrefix = "aprilhub:bff:cache:"

// CacheTTL defines endpoint-specific cache durations.
type CacheTTL struct {
	PathPattern string
	Duration    time.Duration
}

// DefaultTTLs returns the default cache TTLs for AprilHub BFF read-only endpoints.
func DefaultTTLs() []CacheTTL {
	return []CacheTTL{
		{PathPattern: "/api/v1/aggregation/dashboard", Duration: 60 * time.Second},
		{PathPattern: "/api/v1/aggregation/summary", Duration: 60 * time.Second},
		{PathPattern: "/api/v1/aggregation/home", Duration: 30 * time.Second},
		{PathPattern: "/api/v1/overview", Duration: 30 * time.Second},
		{PathPattern: "/api/v1/me", Duration: 10 * time.Second},
	}
}

// CacheConfig holds Redis-backed cache settings.
type CacheConfig struct {
	// TTLs defines cache duration per path pattern (longest match wins).
	TTLs []CacheTTL
	// RedisClient is the Redis connection used for caching.
	RedisClient *redis.Client
	// Enabled disables caching when false (useful for testing).
	Enabled bool
}

// ResolveTTL finds the best matching TTL for the request path.
// Returns 0 duration if no match or path is not cacheable.
func ResolveTTL(path string, ttls []CacheTTL) time.Duration {
	var best string
	var bestDur time.Duration
	for _, t := range ttls {
		if strings.HasPrefix(path, t.PathPattern) && len(t.PathPattern) > len(best) {
			best = t.PathPattern
			bestDur = t.Duration
		}
	}
	return bestDur
}

// Middleware returns an http.Handler that caches GET responses in Redis.
// Only 200 OK GET responses are cached. Non-2xx and non-GET pass through.
func (cfg *CacheConfig) Middleware(next http.Handler) http.Handler {
	if !cfg.Enabled {
		return next
	}
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			next.ServeHTTP(w, r)
			return
		}

		ttl := ResolveTTL(r.URL.Path, cfg.TTLs)
		if ttl <= 0 {
			next.ServeHTTP(w, r)
			return
		}

		key := buildCacheKey(r)
		if hit, body := cacheHit(cfg.RedisClient, key); hit {
			// Cache HIT: write cached response
			w.Header().Set("X-Cache", "HIT")
			w.Header().Set("Cache-Control", "public, max-age="+timeToSec(ttl))
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write(body)
			observability.ObserveCacheHit(r.URL.Path)
			return
		}

		// Cache MISS: capture response, store, delegate
		rw := &captureResponseWriter{ResponseWriter: w, statusCode: http.StatusOK}
		next.ServeHTTP(rw, r)

		observability.ObserveCacheMiss(r.URL.Path)

		if rw.statusCode == http.StatusOK {
			w.Header().Set("X-Cache", "MISS")
			w.Header().Set("Cache-Control", "public, max-age="+timeToSec(ttl))
			_ = cacheStore(cfg.RedisClient, key, rw.body, ttl)
		} else {
			w.Header().Set("X-Cache", "MISS")
		}
	})
}

// buildCacheKey creates a tenant-scoped, user-isolated cache key.
// Format: aprilhub:bff:cache:{tenantID}:{endpoint}:{user-or-anon}:{query-hash}
func buildCacheKey(r *http.Request) string {
	userID := "anon"
	tenantID := "anon"
	if claims, ok := auth.ClaimsFromContext(r.Context()); ok {
		userID = claims.Subject
		tenantID = claims.TenantID
	}
	queryHash := r.URL.RawQuery
	if queryHash == "" {
		queryHash = "none"
	}
	return cachePrefix + tenantID + ":" + r.URL.Path + ":" + userID + ":" + queryHash
}

// cacheHit checks Redis for a cached response. Returns (hit, body).
func cacheHit(rc *redis.Client, key string) (bool, []byte) {
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()
	val, err := rc.Eval(ctx, "return redis.call('GET', KEYS[1])", []string{key}).Result()
	if err != nil || val == nil {
		return false, nil
	}
	body, ok := val.(string)
	if !ok || body == "" {
		return false, nil
	}
	return true, []byte(body)
}

// cacheStore stores the response body in Redis with TTL.
func cacheStore(rc *redis.Client, key string, body []byte, ttl time.Duration) error {
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()
	ttlSec := int64(ttl.Seconds())
	err := rc.Eval(ctx,
		"redis.call('SET', KEYS[1], ARGV[1], 'EX', tonumber(ARGV[2])); return 1",
		[]string{key}, string(body), ttlSec).Err()
	if err != nil {
		slog.Error("hub-bff cache store error", "error", err, "key", key, "ttl", ttl)
		return err
	}
	return nil
}

func timeToSec(d time.Duration) string {
	return strconv.FormatInt(int64(d.Seconds()), 10)
}

// captureResponseWriter wraps http.ResponseWriter to capture body and status code.
type captureResponseWriter struct {
	http.ResponseWriter
	statusCode int
	body       []byte
}

func (rw *captureResponseWriter) WriteHeader(code int) {
	rw.statusCode = code
	// intentionally NOT calling next.WriteHeader yet — we set headers after cache logic
}

func (rw *captureResponseWriter) Write(b []byte) (int, error) {
	rw.body = append(rw.body, b...)
	return len(b), nil
}

// InvalidateEndpoint clears all cache entries matching a path pattern.
// New key format: aprilhub:bff:cache:{tenantID}:{endpoint}:{user}:{query}
func (cfg *CacheConfig) InvalidateEndpoint(pattern string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()
	// Match: aprilhub:bff:cache:*:pattern:*:*
	// The wildcard * covers any tenantID before the pattern
	prefix := cachePrefix + "*" + pattern + ":"
	// Use SCAN-like pattern via Lua to delete keys
	script := `
for i, key in ipairs(redis.call('KEYS', ARGV[1])) do
    redis.call('DEL', key)
end
return redis.call('KEYS', ARGV[1])
`
	_, err := cfg.RedisClient.Eval(ctx, script, nil, prefix+"*").Result()
	if err != nil {
		slog.Info("hub-bff cache invalidation error", "error", err, "pattern", pattern)
		return err
	}
	slog.Info("hub-bff cache invalidated", "pattern", pattern)
	return nil
}
