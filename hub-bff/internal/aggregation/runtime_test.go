package aggregation

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
)

func TestRuntimeDashboardDegradedMode(t *testing.T) {
	t.Parallel()

	okServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		_ = json.NewEncoder(w).Encode(map[string]any{"value": "ok"})
	}))
	defer okServer.Close()

	failServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusServiceUnavailable)
	}))
	defer failServer.Close()

	runtime := NewRuntime(&http.Client{}, Options{Timeout: time.Second, Retries: 0}, map[string]string{
		"workflow": okServer.URL,
		"nflow":    failServer.URL,
		"profil":   okServer.URL,
	})
	response := runtime.Dashboard(context.Background(), Metadata{
		CorrelationID: "corr-1",
		RequestID:     "req-1",
		SourceService: "hub-shell",
	})

	if response.Status != "degraded" {
		t.Fatalf("status = %s, want degraded", response.Status)
	}
	if len(response.Degraded) != 1 {
		t.Fatalf("degraded = %d, want 1", len(response.Degraded))
	}
	if _, ok := response.Data["workflow"]; !ok {
		t.Fatal("workflow payload is missing")
	}
}

func TestServiceAdapterRetryAndTimeout(t *testing.T) {
	t.Parallel()

	calls := 0
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		calls++
		time.Sleep(30 * time.Millisecond)
		_ = json.NewEncoder(w).Encode(map[string]any{"ok": true})
	}))
	defer server.Close()

	adapter := NewServiceAdapter(&http.Client{}, "AprilWorkFlow", server.URL, Options{
		Timeout: 10 * time.Millisecond,
		Retries: 1,
	})
	_, err := adapter.Fetch(context.Background(), "/api/v1/ui/dashboard/workflow", Metadata{
		CorrelationID: "corr-1",
		RequestID:     "req-1",
		SourceService: "hub-shell",
	})
	if err == nil {
		t.Fatal("expected timeout error")
	}
	if calls < 2 {
		t.Fatalf("calls = %d, want at least 2 attempts", calls)
	}
}
