package aggregation

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
)

func TestServiceAdapterMetadataHeaders(t *testing.T) {
	t.Parallel()

	var gotCorrelation string
	var gotRequestID string
	var gotSource string
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		gotCorrelation = r.Header.Get("X-Correlation-Id")
		gotRequestID = r.Header.Get("X-Request-Id")
		gotSource = r.Header.Get("X-Source-Service")
		_ = json.NewEncoder(w).Encode(map[string]any{"ok": true})
	}))
	defer server.Close()

	adapter := NewServiceAdapter(&http.Client{}, "AprilWorkFlow", server.URL, Options{
		Timeout: time.Second,
		Retries: 0,
	})
	_, err := adapter.Fetch(context.Background(), "/api/v1/ui/dashboard/workflow", Metadata{
		CorrelationID: "corr-123",
		RequestID:     "req-123",
		SourceService: "hub-shell",
	})
	if err != nil {
		t.Fatalf("fetch failed: %v", err)
	}
	if gotCorrelation != "corr-123" || gotRequestID != "req-123" {
		t.Fatalf("metadata headers mismatch: corr=%s req=%s", gotCorrelation, gotRequestID)
	}
	if gotSource != bffSourceService {
		t.Fatalf("source header = %s, want %s", gotSource, bffSourceService)
	}
}

func TestServiceAdapterFailsWhenBaseURLMissing(t *testing.T) {
	t.Parallel()

	adapter := NewServiceAdapter(&http.Client{}, "AprilWorkFlow", "", Options{
		Timeout: time.Second,
		Retries: 0,
	})
	_, err := adapter.Fetch(context.Background(), "/api/v1/ui/dashboard/workflow", Metadata{})
	if err == nil {
		t.Fatal("expected error for missing base URL")
	}
}

func TestServiceAdapterInvalidJSON(t *testing.T) {
	t.Parallel()

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte("{invalid json"))
	}))
	defer server.Close()

	adapter := NewServiceAdapter(&http.Client{}, "AprilWorkFlow", server.URL, Options{
		Timeout: time.Second,
		Retries: 0,
	})
	_, err := adapter.Fetch(context.Background(), "/api/v1/ui/dashboard/workflow", Metadata{})
	if err == nil {
		t.Fatal("expected parse error for invalid JSON")
	}
}
