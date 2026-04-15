package aggregation

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"sync"
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

func TestRuntimeDoesNotLeakStateAcrossCalls(t *testing.T) {
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

	first := runtime.Dashboard(context.Background(), Metadata{
		CorrelationID: "corr-1",
		RequestID:     "req-1",
		SourceService: "hub-shell",
	})
	second := runtime.Dashboard(context.Background(), Metadata{
		CorrelationID: "corr-2",
		RequestID:     "req-2",
		SourceService: "hub-shell",
	})

	if first.Metadata.CorrelationID != "corr-1" || second.Metadata.CorrelationID != "corr-2" {
		t.Fatalf("unexpected metadata isolation: first=%+v second=%+v", first.Metadata, second.Metadata)
	}
	if len(first.Degraded) != 1 || len(second.Degraded) != 1 {
		t.Fatalf("degraded results must be request-local: first=%d second=%d", len(first.Degraded), len(second.Degraded))
	}
	if len(first.Data) != len(second.Data) {
		t.Fatalf("data payload mismatch across stateless calls: first=%d second=%d", len(first.Data), len(second.Data))
	}
}

func TestRuntimeConcurrentCallsRemainIndependent(t *testing.T) {
	t.Parallel()

	okServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		_ = json.NewEncoder(w).Encode(map[string]any{"value": "ok"})
	}))
	defer okServer.Close()

	runtime := NewRuntime(&http.Client{}, Options{Timeout: time.Second, Retries: 0}, map[string]string{
		"workflow": okServer.URL,
		"nflow":    okServer.URL,
		"profil":   okServer.URL,
	})

	const requests = 8
	results := make(chan aggregationResult, requests)
	var wg sync.WaitGroup
	for i := 0; i < requests; i++ {
		i := i
		wg.Add(1)
		go func() {
			defer wg.Done()
			md := Metadata{
				CorrelationID: "corr-" + string(rune('A'+i)),
				RequestID:     "req-" + string(rune('A'+i)),
				SourceService: "hub-shell",
			}
			resp := runtime.Dashboard(context.Background(), md)
			results <- aggregationResult{metadata: md, response: resp}
		}()
	}
	wg.Wait()
	close(results)

	seen := map[string]bool{}
	for result := range results {
		gotCorr := result.response.Metadata.CorrelationID
		if gotCorr != result.metadata.CorrelationID {
			t.Fatalf("response metadata mismatch: got=%s want=%s", gotCorr, result.metadata.CorrelationID)
		}
		if seen[gotCorr] {
			t.Fatalf("duplicate correlation id in concurrent results: %s", gotCorr)
		}
		seen[gotCorr] = true
	}

	if len(seen) != requests {
		t.Fatalf("seen results = %d, want %d", len(seen), requests)
	}
}

type aggregationResult struct {
	metadata Metadata
	response ResponseEnvelope
}
