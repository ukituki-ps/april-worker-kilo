package httpapi

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestCORSPreflightAllowedOrigin(t *testing.T) {
	t.Parallel()

	allowed := []string{"https://example.com"}
	called := false
	handler := CORS(allowed, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		called = true
	}))

	req := httptest.NewRequest(http.MethodOptions, "/", nil)
	req.Header.Set("Origin", "https://example.com")
	rec := httptest.NewRecorder()

	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusNoContent {
		t.Fatalf("status = %d, want 204", rec.Code)
	}
	if called {
		t.Fatal("next handler must not be called during preflight")
	}
	if rec.Header().Get("Access-Control-Allow-Origin") != "https://example.com" {
		t.Fatalf("allow-origin = %q, want https://example.com", rec.Header().Get("Access-Control-Allow-Origin"))
	}
	if rec.Header().Get("Access-Control-Allow-Methods") == "" {
		t.Fatal("Access-Control-Allow-Methods must be set")
	}
	if rec.Header().Get("Access-Control-Allow-Headers") == "" {
		t.Fatal("Access-Control-Allow-Headers must be set")
	}
	if rec.Header().Get("Access-Control-Max-Age") != "86400" {
		t.Fatalf("Access-Control-Max-Age = %q, want 86400", rec.Header().Get("Access-Control-Max-Age"))
	}
	if rec.Header().Get("Access-Control-Expose-Headers") != "X-Correlation-Id, X-Request-Id" {
		t.Fatalf("Access-Control-Expose-Headers = %q, want X-Correlation-Id, X-Request-Id", rec.Header().Get("Access-Control-Expose-Headers"))
	}
}

func TestCORSPreflightDeniedOrigin(t *testing.T) {
	t.Parallel()

	allowed := []string{"https://example.com"}
	handler := CORS(allowed, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {}))

	req := httptest.NewRequest(http.MethodOptions, "/", nil)
	req.Header.Set("Origin", "https://evil.com")
	rec := httptest.NewRecorder()

	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusNoContent {
		t.Fatalf("status = %d, want 204", rec.Code)
	}
	if rec.Header().Get("Access-Control-Allow-Origin") != "" {
		t.Fatalf("Access-Control-Allow-Origin must be empty for disallowed origin, got %q", rec.Header().Get("Access-Control-Allow-Origin"))
	}
}

func TestCORSPreflightNoOrigin(t *testing.T) {
	t.Parallel()

	allowed := []string{"https://example.com"}
	handler := CORS(allowed, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {}))

	req := httptest.NewRequest(http.MethodOptions, "/", nil)
	rec := httptest.NewRecorder()

	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusNoContent {
		t.Fatalf("status = %d, want 204", rec.Code)
	}
	if rec.Header().Get("Access-Control-Allow-Origin") != "" {
		t.Fatalf("Access-Control-Allow-Origin must be empty when no Origin header, got %q", rec.Header().Get("Access-Control-Allow-Origin"))
	}
}

func TestCORSPreflightVaryHeader(t *testing.T) {
	t.Parallel()

	allowed := []string{"https://example.com"}
	handler := CORS(allowed, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {}))

	req := httptest.NewRequest(http.MethodOptions, "/", nil)
	req.Header.Set("Origin", "https://example.com")
	rec := httptest.NewRecorder()

	handler.ServeHTTP(rec, req)

	if rec.Header().Get("Vary") != "Origin" {
		t.Fatalf("Vary = %q, want Origin", rec.Header().Get("Vary"))
	}
}

func TestCORSNormalRequestPassThrough(t *testing.T) {
	t.Parallel()

	allowed := []string{"https://example.com"}
	called := false
	handler := CORS(allowed, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		called = true
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.Header.Set("Origin", "https://example.com")
	rec := httptest.NewRecorder()

	handler.ServeHTTP(rec, req)

	if !called {
		t.Fatal("next handler must be called for non-OPTIONS request")
	}
	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", rec.Code)
	}
	if rec.Header().Get("Access-Control-Allow-Origin") != "https://example.com" {
		t.Fatalf("allow-origin = %q, want https://example.com", rec.Header().Get("Access-Control-Allow-Origin"))
	}
}
