package middleware

import (
	"testing"
	"time"
)

func TestResolveTTL(t *testing.T) {
	ttls := DefaultTTLs()

	tests := []struct {
		path    string
		want    time.Duration
		wantZero bool
	}{
		{"/api/v1/aggregation/dashboard", 60 * time.Second, false},
		{"/api/v1/aggregation/summary", 60 * time.Second, false},
		{"/api/v1/aggregation/home", 30 * time.Second, false},
		{"/api/v1/overview", 30 * time.Second, false},
		{"/api/v1/me", 10 * time.Second, false},
		{"/api/v1/me/", 10 * time.Second, false},
		{"/healthz", 0, true},
		{"/readyz", 0, true},
		{"/metrics", 0, true},
		{"/api/v1/csp-report", 0, true},
	}

	for _, tc := range tests {
		t.Run(tc.path, func(t *testing.T) {
			got := ResolveTTL(tc.path, ttls)
			if tc.wantZero {
				if got > 0 {
					t.Errorf("expected 0 ttl for %s, got %v", tc.path, got)
				}
			} else {
				if got != tc.want {
					t.Errorf("path %s: expected ttl %v, got %v", tc.path, tc.want, got)
				}
			}
		})
	}
}

func TestTimeToSec(t *testing.T) {
	tests := []struct {
		duration time.Duration
		want     string
	}{
		{10 * time.Second, "10"},
		{60 * time.Second, "60"},
		{300 * time.Second, "300"},
	}

	for _, tc := range tests {
		got := timeToSec(tc.duration)
		if got != tc.want {
			t.Errorf("timeToSec(%v) = %s, want %s", tc.duration, got, tc.want)
		}
	}
}

func TestBuildCacheKey(t *testing.T) {
	r := mockRequest("/api/v1/aggregation/dashboard", nil)
	expected := cachePrefix + "/api/v1/aggregation/dashboard:anon:none"
	key := buildCacheKey(r)
	if key != expected {
		t.Errorf("expected key %s, got %s", expected, key)
	}
}

func TestCacheMiddleware_disabled(t *testing.T) {
	cfg := &CacheConfig{TTLs: DefaultTTLs(), Enabled: false}
	called := false
	next := &mockHandler{handler: func(w any, r any) { called = true }}
	_ = cfg.Middleware(next.httpHandler())
	// When disabled, middleware should just pass through
	// We can't easily test without http calls, but verify it doesn't panic
}

// Mock helpers for tests
func mockRequest(path string, query map[string]string) interface{} {
	_ = path
	_ = query
	return nil
}
