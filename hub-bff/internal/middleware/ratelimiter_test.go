package middleware

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestResolveTier(t *testing.T) {
	tiers := DefaultTiers()

	tests := []struct {
		path     string
		wantNil  bool
		wantTier string
	}{
		{"/api/v1/me", false, "/api/v1/me"},
		{"/api/v1/admin/ping", false, "/api/v1/admin"},
		{"/api/v1/aggregation/dashboard", false, "/api/v1/aggregation"},
		{"/api/v1/overview", false, "/api/v1/overview"},
		{"/healthz", true, ""},
		{"/readyz", true, ""},
		{"/metrics", true, ""},
	}

	for _, tc := range tests {
		t.Run(tc.path, func(t *testing.T) {
			resolved := ResolveTier(tc.path, tiers)
			if tc.wantNil {
				if resolved != nil {
					t.Fatalf("expected nil for %s, got %+v", tc.path, resolved)
				}
			} else {
				if resolved == nil {
					t.Fatalf("expected tier for %s, got nil", tc.path)
				}
				if resolved.Matches != tc.wantTier {
					t.Errorf("path %s: expected tier %s, got %s", tc.path, tc.wantTier, resolved.Matches)
				}
			}
		})
	}
}

func TestPathMatches(t *testing.T) {
	tests := []struct {
		path    string
		pattern string
		want    bool
	}{
		{"/api/v1/me", "/api/v1/me", true},
		{"/api/v1/me/", "/api/v1/me", true},
		{"/api/v1/admin/ping", "/api/v1/admin", true},
		{"/healthz", "/api/v1", false},
		{"/", "/api/v1", false},
	}

	for _, tc := range tests {
		got := pathMatches(tc.path, tc.pattern)
		if got != tc.want {
			t.Errorf("pathMatches(%q, %q) = %v, want %v", tc.path, tc.pattern, got, tc.want)
		}
	}
}

func TestWriteTooManyRequests(t *testing.T) {
	w := httptest.NewRecorder()
	retryAfter := int64(30)
	writeTooManyRequests(w, retryAfter)

	if w.Code != http.StatusTooManyRequests {
		t.Errorf("expected 429, got %d", w.Code)
	}

	if w.Header().Get("Retry-After") == "" {
		t.Error("expected Retry-After header, got none")
	}

	var body map[string]any
	if err := json.NewDecoder(w.Body).Decode(&body); err != nil {
		t.Fatalf("failed to decode response body: %v", err)
	}

	if body["code"] != "rate_limit_exceeded" {
		t.Errorf("expected code 'rate_limit_exceeded', got %v", body["code"])
	}
}

// TestRateLimitHeaders проверяет установку заголовков X-RateLimit-Limit и X-RateLimit-Remaining.
func TestRateLimitHeaders(t *testing.T) {
	w := httptest.NewRecorder()
	RateLimitHeaders(w, 10, 3)

	if got := w.Header().Get("X-RateLimit-Limit"); got != "10" {
		t.Errorf("expected X-RateLimit-Limit=10, got %s", got)
	}
	if got := w.Header().Get("X-RateLimit-Remaining"); got != "3" {
		t.Errorf("expected X-RateLimit-Remaining=3, got %s", got)
	}
}

// TestCountingRateLimiterAllow проверяет CountingRateLimiter.
func TestCountingRateLimiterAllow(t *testing.T) {
	limiter := NewCountingRateLimiter(3)
	ctx := t.Context()

	for i := 0; i < 3; i++ {
		allowed, remaining, limit, retryAfter := limiter.Allow(ctx, "key1")
		if !allowed {
			t.Errorf("call %d: expected allowed=true", i+1)
		}
		if remaining != 3-i-1 {
			t.Errorf("call %d: expected remaining=%d, got %d", i+1, 3-i-1, remaining)
		}
		if limit != 3 {
			t.Errorf("call %d: expected limit=3, got %d", i+1, limit)
		}
		if retryAfter != 0 {
			t.Errorf("call %d: expected retryAfter=0, got %d", i+1, retryAfter)
		}
	}

	// 4-й вызов должен быть denied.
	allowed, remaining, limit, retryAfter := limiter.Allow(ctx, "key1")
	if allowed {
		t.Error("4th call: expected allowed=false")
	}
	if remaining != 0 {
		t.Errorf("4th call: expected remaining=0, got %d", remaining)
	}
	if limit != 3 {
		t.Errorf("4th call: expected limit=3, got %d", limit)
	}
	if retryAfter != 1 {
		t.Errorf("4th call: expected retryAfter=1, got %d", retryAfter)
	}
}

// TestCountingRateLimiterDifferentKeys проверяет, что разные ключи имеют отдельные счётчики.
func TestCountingRateLimiterDifferentKeys(t *testing.T) {
	limiter := NewCountingRateLimiter(2)
	ctx := t.Context()

	// key1 — исчерпать лимит.
	limiter.Allow(ctx, "key1")
	limiter.Allow(ctx, "key1")
	allowed, _, _, _ := limiter.Allow(ctx, "key1")
	if allowed {
		t.Error("key1 на 3-й вызов: expected denied")
	}

	// key2 всё ещё доступен.
	allowed, _, _, _ = limiter.Allow(ctx, "key2")
	if !allowed {
		t.Error("key2 первый вызов: expected allowed")
	}
}
