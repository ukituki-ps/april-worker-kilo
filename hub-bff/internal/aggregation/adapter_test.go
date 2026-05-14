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

func TestServiceAdapterTimeout(t *testing.T) {
	t.Parallel()

	server := httptest.NewServer(http.HandlerFunc(func(_ http.ResponseWriter, r *http.Request) {
		<-r.Context().Done()
	}))
	defer server.Close()

	adapter := NewServiceAdapter(&http.Client{}, "AprilWorkFlow", server.URL, Options{
		Timeout: 50 * time.Millisecond,
		Retries: 0,
	})

	start := time.Now()
	_, err := adapter.Fetch(context.Background(), "/api/v1/ui/dashboard/workflow", Metadata{})
	elapsed := time.Since(start)

	if err == nil {
		t.Fatal("expected timeout error")
	}
	if elapsed < 40*time.Millisecond {
		t.Fatalf("return too fast: %v", elapsed)
	}
	if elapsed > 500*time.Millisecond {
		t.Fatalf("timeout took too long: %v", elapsed)
	}
}

func TestServiceAdapterRetryExhaustion(t *testing.T) {
	t.Parallel()

	var attempts int
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		attempts++
		w.WriteHeader(http.StatusServiceUnavailable)
	}))
	defer server.Close()

	maxRetries := 3
	adapter := NewServiceAdapter(&http.Client{}, "AprilWorkFlow", server.URL, Options{
		Timeout: time.Second,
		Retries: maxRetries,
	})

	_, err := adapter.Fetch(context.Background(), "/api/v1/ui/dashboard/workflow", Metadata{})
	if err == nil {
		t.Fatal("expected error after retry exhaustion")
	}
	expectedAttempts := maxRetries + 1
	if attempts != expectedAttempts {
		t.Fatalf("attempts = %d, want %d", attempts, expectedAttempts)
	}
}

func TestServiceAdapter5xx_NoRetry_OnZeroRetries(t *testing.T) {
	t.Parallel()

	var attempts int
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		attempts++
		w.WriteHeader(http.StatusInternalServerError)
	}))
	defer server.Close()

	adapter := NewServiceAdapter(&http.Client{}, "AprilWorkFlow", server.URL, Options{
		Timeout: time.Second,
		Retries: 0,
	})

	_, err := adapter.Fetch(context.Background(), "/api/v1/ui/dashboard/workflow", Metadata{})
	if err == nil {
		t.Fatal("expected error for 500 response")
	}
	if attempts != 1 {
		t.Fatalf("attempts = %d, want 1 (no retries)", attempts)
	}
}

func TestServiceAdapter5xx_Retries_Count(t *testing.T) {
	t.Parallel()

	var attempts int
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		attempts++
		w.WriteHeader(http.StatusBadGateway)
	}))
	defer server.Close()

	adapter := NewServiceAdapter(&http.Client{}, "AprilWorkFlow", server.URL, Options{
		Timeout: time.Second,
		Retries: 2,
	})

	_, err := adapter.Fetch(context.Background(), "/api/v1/ui/dashboard/workflow", Metadata{})
	if err == nil {
		t.Fatal("expected error for 502 response")
	}
	if attempts != 3 {
		t.Fatalf("attempts = %d, want 3 (1 initial + 2 retries)", attempts)
	}
}

func TestServiceAdapter5xx_ErrorMessage(t *testing.T) {
	t.Parallel()

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusGatewayTimeout)
	}))
	defer server.Close()

	adapter := NewServiceAdapter(&http.Client{}, "AprilWorkFlow", server.URL, Options{
		Timeout: time.Second,
		Retries: 0,
	})

	_, err := adapter.Fetch(context.Background(), "/api/v1/ui/dashboard/workflow", Metadata{})
	if err == nil {
		t.Fatal("expected error for 504 response")
	}
}

func TestServiceAdapterParseError_Retries(t *testing.T) {
	t.Parallel()

	var attempts int
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		attempts++
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte("not json at all"))
	}))
	defer server.Close()

	adapter := NewServiceAdapter(&http.Client{}, "AprilWorkFlow", server.URL, Options{
		Timeout: time.Second,
		Retries: 2,
	})

	_, err := adapter.Fetch(context.Background(), "/api/v1/ui/dashboard/workflow", Metadata{})
	if err == nil {
		t.Fatal("expected parse error after retry exhaustion")
	}
	if attempts != 3 {
		t.Fatalf("attempts = %d, want 3", attempts)
	}
}

func TestServiceAdapterParseError_Recoverable(t *testing.T) {
	t.Parallel()

	var attempts int
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		attempts++
		if attempts < 2 {
			w.Header().Set("Content-Type", "application/json")
			_, _ = w.Write([]byte("bad json"))
			return
		}
		_ = json.NewEncoder(w).Encode(map[string]any{"recovered": true})
	}))
	defer server.Close()

	adapter := NewServiceAdapter(&http.Client{}, "AprilWorkFlow", server.URL, Options{
		Timeout: time.Second,
		Retries: 2,
	})

	data, err := adapter.Fetch(context.Background(), "/api/v1/ui/dashboard/workflow", Metadata{})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if attempts != 2 {
		t.Fatalf("attempts = %d, want 2", attempts)
	}
	if val, ok := data["recovered"]; !ok || val != true {
		t.Fatalf("recovered = %v, want true", data["recovered"])
	}
}

func TestServiceAdapter4xx_NoRetry(t *testing.T) {
	t.Parallel()

	var attempts int
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		attempts++
		w.WriteHeader(http.StatusNotFound)
	}))
	defer server.Close()

	adapter := NewServiceAdapter(&http.Client{}, "AprilWorkFlow", server.URL, Options{
		Timeout: time.Second,
		Retries: 2,
	})

	_, err := adapter.Fetch(context.Background(), "/api/v1/ui/dashboard/workflow", Metadata{})
	if err == nil {
		t.Fatal("expected error for 404 response")
	}
	if attempts != 3 {
		t.Fatalf("attempts = %d, want 3 (4xx also triggers retry loop)", attempts)
	}
}

func TestServiceAdapterSuccess_NoExtraRequests(t *testing.T) {
	t.Parallel()

	var attempts int
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		attempts++
		_ = json.NewEncoder(w).Encode(map[string]any{"ok": true})
	}))
	defer server.Close()

	adapter := NewServiceAdapter(&http.Client{}, "AprilWorkFlow", server.URL, Options{
		Timeout: time.Second,
		Retries: 5,
	})

	_, err := adapter.Fetch(context.Background(), "/api/v1/ui/dashboard/workflow", Metadata{})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if attempts != 1 {
		t.Fatalf("attempts = %d, want 1 (success should stop)", attempts)
	}
}

func TestServiceAdapterContextCancellation(t *testing.T) {
	t.Parallel()

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		<-r.Context().Done()
	}))
	defer server.Close()

	adapter := NewServiceAdapter(&http.Client{}, "AprilWorkFlow", server.URL, Options{
		Timeout: time.Second,
		Retries: 0,
	})

	ctx, cancel := context.WithCancel(context.Background())
	cancel()

	_, err := adapter.Fetch(ctx, "/api/v1/ui/dashboard/workflow", Metadata{})
	if err == nil {
		t.Fatal("expected error for cancelled context")
	}
}

func TestServiceAdapterMultiple5xx_SameError(t *testing.T) {
	t.Parallel()

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusInternalServerError)
	}))
	defer server.Close()

	adapter := NewServiceAdapter(&http.Client{}, "AprilWorkFlow", server.URL, Options{
		Timeout: time.Second,
		Retries: 2,
	})

	_, err := adapter.Fetch(context.Background(), "/api/v1/ui/dashboard/workflow", Metadata{})
	if err == nil {
		t.Fatal("expected error after retries")
	}
}

func TestServiceAdapterMixed5xx_AndSuccess(t *testing.T) {
	t.Parallel()

	var attempts int
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		attempts++
		if attempts == 1 {
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		if attempts == 2 {
			w.WriteHeader(http.StatusBadGateway)
			return
		}
		_ = json.NewEncoder(w).Encode(map[string]any{"final": true})
	}))
	defer server.Close()

	adapter := NewServiceAdapter(&http.Client{}, "AprilWorkFlow", server.URL, Options{
		Timeout: time.Second,
		Retries: 3,
	})

	data, err := adapter.Fetch(context.Background(), "/api/v1/ui/dashboard/workflow", Metadata{})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if attempts != 3 {
		t.Fatalf("attempts = %d, want 3", attempts)
	}
	if val, ok := data["final"]; !ok || val != true {
		t.Fatalf("final = %v, want true", data["final"])
	}
}
