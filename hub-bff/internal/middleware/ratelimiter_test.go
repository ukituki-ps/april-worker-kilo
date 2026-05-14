package middleware

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
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
		{"/api/v1/csp-report", false, "/api/v1/csp-report"},
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

func TestParseTierValue(t *testing.T) {
	tests := []struct {
		input   string
		wantReq int
		wantWin int
	}{
		{"60:60", 60, 60},
		{"100:30", 100, 30},
		{" 20 : 120 ", 20, 120},
		{"abc:60", 0, 0},
		{"60:abc", 0, 0},
		{"60", 0, 0},
		{"", 0, 0},
		{":", 0, 0},
	}

	for _, tc := range tests {
		t.Run(tc.input, func(t *testing.T) {
			gotReq, gotWin := parseTierValue(tc.input)
			if gotReq != tc.wantReq || gotWin != tc.wantWin {
				t.Errorf("parseTierValue(%q) = (%d, %d), want (%d, %d)", tc.input, gotReq, gotWin, tc.wantReq, tc.wantWin)
			}
		})
	}
}

func TestDefaultTiersEnvOverride(t *testing.T) {
	_ = os.Unsetenv("RATE_LIMIT_TIER_GENERAL")
	_ = os.Unsetenv("RATE_LIMIT_TIER_SENSITIVE")

	t.Setenv("RATE_LIMIT_TIER_GENERAL", "200:30")
	t.Setenv("RATE_LIMIT_TIER_SENSITIVE", "5:120")

	tiers := DefaultTiers()
	if len(tiers) == 0 {
		t.Fatal("expected non-empty tiers")
	}

	generalTier := ResolveTier("/api/v1/aggregation", tiers)
	if generalTier == nil {
		t.Fatal("expected general tier for /api/v1/aggregation")
	}
	if generalTier.Limit != 200 {
		t.Errorf("general tier limit: expected 200, got %d", generalTier.Limit)
	}
	if generalTier.WindowSeconds != 30 {
		t.Errorf("general tier window: expected 30, got %d", generalTier.WindowSeconds)
	}

	sensitiveTier := ResolveTier("/api/v1/me", tiers)
	if sensitiveTier == nil {
		t.Fatal("expected sensitive tier for /api/v1/me")
	}
	if sensitiveTier.Limit != 5 {
		t.Errorf("sensitive tier limit: expected 5, got %d", sensitiveTier.Limit)
	}
	if sensitiveTier.WindowSeconds != 120 {
		t.Errorf("sensitive tier window: expected 120, got %d", sensitiveTier.WindowSeconds)
	}
}

func TestDefaultTiersCSPReport(t *testing.T) {
	_ = os.Unsetenv("RATE_LIMIT_TIER_GENERAL")
	_ = os.Unsetenv("RATE_LIMIT_TIER_SENSITIVE")

	tiers := DefaultTiers()
	cspTier := ResolveTier("/api/v1/csp-report", tiers)
	if cspTier == nil {
		t.Fatal("expected tier for /api/v1/csp-report")
	}
	if cspTier.Limit != 30 {
		t.Errorf("csp-report limit: expected 30, got %d", cspTier.Limit)
	}
	if cspTier.WindowSeconds != 60 {
		t.Errorf("csp-report window: expected 60, got %d", cspTier.WindowSeconds)
	}
	if cspTier.Sensitive {
		t.Error("csp-report should not be sensitive")
	}
}
