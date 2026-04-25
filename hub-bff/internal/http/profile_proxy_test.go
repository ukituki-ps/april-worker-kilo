package httpapi

import (
	"context"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/ukituki-ps/april-worker/hub-bff/internal/aggregation"
)

func TestProfileAdminProxyForwardsPathAndHeaders(t *testing.T) {
	t.Parallel()

	type observedRequest struct {
		Path          string `json:"path"`
		Authorization string `json:"authorization"`
		CorrelationID string `json:"correlationId"`
		RequestID     string `json:"requestId"`
		TenantID      string `json:"tenantId"`
	}

	var got observedRequest
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		got = observedRequest{
			Path:          r.URL.Path,
			Authorization: r.Header.Get("Authorization"),
			CorrelationID: r.Header.Get("X-Correlation-Id"),
			RequestID:     r.Header.Get("X-Request-Id"),
			TenantID:      r.Header.Get("X-Tenant-Id"),
		}
		_, _ = io.WriteString(w, `{"status":"ok"}`)
	}))
	defer upstream.Close()

	proxy, err := NewProfileAdminProxy(upstream.URL + "/profile-api")
	if err != nil {
		t.Fatalf("init proxy: %v", err)
	}

	req := httptest.NewRequest(http.MethodGet, "/api/v1/admin/profile/users/current", nil)
	req.Header.Set("Authorization", "Bearer test-token")
	req.Header.Set("X-Tenant-Id", "tenant-42")
	req = req.WithContext(context.WithValue(req.Context(), requestMetadataKey, aggregation.Metadata{
		CorrelationID: "corr-1",
		RequestID:     "req-1",
		SourceService: "hub-shell",
	}))
	rec := httptest.NewRecorder()

	proxy.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", rec.Code)
	}
	if got.Path != "/profile-api/users/current" {
		t.Fatalf("upstream path = %s, want /profile-api/users/current", got.Path)
	}
}

func TestProfileAdminProxyStripsLeadingAPIFromOpenAPIPrefix(t *testing.T) {
	t.Parallel()

	var gotPath string
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		gotPath = r.URL.Path
		_, _ = io.WriteString(w, `{"status":"ok"}`)
	}))
	defer upstream.Close()

	proxy, err := NewProfileAdminProxy(upstream.URL)
	if err != nil {
		t.Fatalf("init proxy: %v", err)
	}

	req := httptest.NewRequest(http.MethodGet, "/api/v1/admin/profile/api/v1/entity-types", nil)
	req = req.WithContext(context.WithValue(req.Context(), requestMetadataKey, aggregation.Metadata{
		CorrelationID: "c", RequestID: "r", SourceService: "hub-bff",
	}))
	rec := httptest.NewRecorder()
	proxy.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", rec.Code)
	}
	if gotPath != "/v1/entity-types" {
		t.Fatalf("upstream path = %q, want /v1/entity-types", gotPath)
	}
}

func TestProfileAdminProxyReturns503WithoutUpstreamConfig(t *testing.T) {
	t.Parallel()

	proxy, err := NewProfileAdminProxy("")
	if err != nil {
		t.Fatalf("init proxy without upstream: %v", err)
	}

	req := httptest.NewRequest(http.MethodGet, "/api/v1/admin/profile/users/current", nil)
	rec := httptest.NewRecorder()
	proxy.ServeHTTP(rec, req)

	if rec.Code != http.StatusServiceUnavailable {
		t.Fatalf("status = %d, want 503", rec.Code)
	}

	var payload map[string]string
	if err := json.Unmarshal(rec.Body.Bytes(), &payload); err != nil {
		t.Fatalf("decode error payload: %v", err)
	}
	if payload["code"] != "proxy_error" {
		t.Fatalf("code = %q, want proxy_error", payload["code"])
	}
}
