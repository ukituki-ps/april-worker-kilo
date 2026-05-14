package httpapi

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
)

type mockRedizer struct {
	pingErr error
}

func (m *mockRedizer) Ping(ctx context.Context) error {
	return m.pingErr
}

func TestHealthzReturns200(t *testing.T) {
	t.Parallel()

	health := NewHealth(&mockRedizer{})
	req := httptest.NewRequest(http.MethodGet, "/healthz", nil)
	rec := httptest.NewRecorder()

	health.Healthz(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", rec.Code)
	}

	var body map[string]string
	if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if body["status"] != "ok" {
		t.Fatalf("status = %s, want ok", body["status"])
	}
	if rec.Header().Get("Content-Type") != "application/json" {
		t.Fatalf("content-type = %s, want application/json", rec.Header().Get("Content-Type"))
	}
}

func TestLivezReturns200(t *testing.T) {
	t.Parallel()

	health := NewHealth(&mockRedizer{})
	req := httptest.NewRequest(http.MethodGet, "/livez", nil)
	rec := httptest.NewRecorder()

	health.Livez(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", rec.Code)
	}

	var body map[string]string
	if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if body["status"] != "alive" {
		t.Fatalf("status = %s, want alive", body["status"])
	}
	if rec.Header().Get("Content-Type") != "application/json" {
		t.Fatalf("content-type = %s, want application/json", rec.Header().Get("Content-Type"))
	}
}

func TestReadyzReturns200WhenRedisHealthy(t *testing.T) {
	t.Parallel()

	health := NewHealth(&mockRedizer{pingErr: nil})
	req := httptest.NewRequest(http.MethodGet, "/readyz", nil)
	rec := httptest.NewRecorder()

	health.Readyz(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", rec.Code)
	}

	var body map[string]string
	if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if body["status"] != "ready" {
		t.Fatalf("status = %s, want ready", body["status"])
	}
	if body["timestamp"] == "" {
		t.Fatal("timestamp must be present")
	}
}

func TestReadyzReturns503WhenRedisUnhealthy(t *testing.T) {
	t.Parallel()

	health := NewHealth(&mockRedizer{pingErr: errors.New("redis connection refused")})
	req := httptest.NewRequest(http.MethodGet, "/readyz", nil)
	rec := httptest.NewRecorder()

	health.Readyz(rec, req)

	if rec.Code != http.StatusServiceUnavailable {
		t.Fatalf("status = %d, want 503", rec.Code)
	}

	var body map[string]any
	if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if body["status"] != "not_ready" {
		t.Fatalf("status = %v, want not_ready", body["status"])
	}
	if body["failure"] != "redis_unavailable" {
		t.Fatalf("failure = %v, want redis_unavailable", body["failure"])
	}
	if body["error"] == nil {
		t.Fatal("error must be present")
	}
}

func TestReadyzSetsContentType(t *testing.T) {
	t.Parallel()

	health := NewHealth(&mockRedizer{pingErr: nil})
	req := httptest.NewRequest(http.MethodGet, "/readyz", nil)
	rec := httptest.NewRecorder()

	health.Readyz(rec, req)

	if rec.Header().Get("Content-Type") != "application/json" {
		t.Fatalf("content-type = %s, want application/json", rec.Header().Get("Content-Type"))
	}
}
