package aggregation

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
)

type mockDownstream struct {
	service string
	path    string
	status  int
	payload map[string]any
}

func setupMockServers(cases []mockDownstream, t *testing.T) (map[string]string, func()) {
	t.Helper()
	urls := make(map[string]string)
	var cleanup func()
	servers := make([]*httptest.Server, 0, len(cases))
	mu := &struct{}{}

	for _, c := range cases {
		_key := c.service
		_status := c.status
		_payload := c.payload
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			_ = mu
			if _status == 0 {
				_status = http.StatusOK
			}
			if _status != http.StatusOK {
				w.WriteHeader(_status)
				return
			}
			w.Header().Set("Content-Type", "application/json")
			_ = json.NewEncoder(w).Encode(_payload)
		}))
		servers = append(servers, server)
		if _, exists := urls[_key]; !exists {
			urls[_key] = server.URL
		}
	}

	cleanup = func() {
		for _, s := range servers {
			s.Close()
		}
	}
	return urls, cleanup
}

func TestContract_Dashboard_AllDownstreamOK(t *testing.T) {
	t.Parallel()

	urls, cleanup := setupMockServers([]mockDownstream{
		{service: "workflow", path: "/api/v1/ui/dashboard/workflow", payload: map[string]any{"totalTasks": 5}},
		{service: "nflow", path: "/api/v1/ui/dashboard/notifications", payload: map[string]any{"unread": 3}},
		{service: "profil", path: "/api/v1/ui/dashboard/profile", payload: map[string]any{"name": "test"}},
	}, t)
	defer cleanup()

	runtime := NewRuntime(&http.Client{}, Options{Timeout: time.Second, Retries: 0}, urls)
	resp := runtime.Dashboard(context.Background(), Metadata{
		CorrelationID: "corr-test",
		RequestID:     "req-test",
	})

	if resp.Status != "ok" {
		t.Fatalf("status = %s, want ok", resp.Status)
	}
	if len(resp.Degraded) > 0 {
		t.Fatalf("degraded should be empty, got %d entries", len(resp.Degraded))
	}
	if _, ok := resp.Data["workflow"]; !ok {
		t.Fatal("missing workflow data")
	}
	if _, ok := resp.Data["notifications"]; !ok {
		t.Fatal("missing notifications data")
	}
	if _, ok := resp.Data["profile"]; !ok {
		t.Fatal("missing profile data")
	}
	if resp.Metadata.CorrelationID != "corr-test" {
		t.Fatalf("correlationId = %s, want corr-test", resp.Metadata.CorrelationID)
	}
	if resp.Metadata.SourceService != "hub-bff" {
		t.Fatalf("sourceService = %s, want hub-bff", resp.Metadata.SourceService)
	}
}

func TestContract_Dashboard_PartialDegraded(t *testing.T) {
	t.Parallel()

	okServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		_ = json.NewEncoder(w).Encode(map[string]any{"value": 1})
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

	resp := runtime.Dashboard(context.Background(), Metadata{
		CorrelationID: "corr-degraded",
		RequestID:     "req-degraded",
	})

	if resp.Status != "degraded" {
		t.Fatalf("status = %s, want degraded", resp.Status)
	}
	if len(resp.Degraded) != 1 {
		t.Fatalf("degraded count = %d, want 1", len(resp.Degraded))
	}
	if resp.Degraded[0].Code != "downstream_unavailable" {
		t.Fatalf("degraded code = %s, want downstream_unavailable", resp.Degraded[0].Code)
	}
	if resp.Degraded[0].SourceService != "AprilNFlow" {
		t.Fatalf("degraded service = %s, want AprilNFlow", resp.Degraded[0].SourceService)
	}
	if _, ok := resp.Data["workflow"]; !ok {
		t.Fatal("workflow should still be present")
	}
	if _, ok := resp.Data["profile"]; !ok {
		t.Fatal("profile should still be present")
	}
}

func TestContract_Dashboard_AllDownstreamFailed(t *testing.T) {
	t.Parallel()

	failServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusInternalServerError)
	}))
	defer failServer.Close()

	runtime := NewRuntime(&http.Client{}, Options{Timeout: time.Second, Retries: 0}, map[string]string{
		"workflow": failServer.URL,
		"nflow":    failServer.URL,
		"profil":   failServer.URL,
	})

	resp := runtime.Dashboard(context.Background(), Metadata{
		CorrelationID: "corr-fail",
		RequestID:     "req-fail",
	})

	if resp.Status != "degraded" {
		t.Fatalf("status = %s, want degraded", resp.Status)
	}
	if len(resp.Degraded) != 3 {
		t.Fatalf("degraded count = %d, want 3", len(resp.Degraded))
	}
	if len(resp.Data) != 0 {
		t.Fatalf("data should be empty, got %d keys", len(resp.Data))
	}
}

func TestContract_Home_AllDownstreamOK(t *testing.T) {
	t.Parallel()

	urls, cleanup := setupMockServers([]mockDownstream{
		{service: "workflow", path: "/api/v1/ui/home/workflow", payload: map[string]any{"events": 10}},
		{service: "orgflow", path: "/api/v1/ui/home/org", payload: map[string]any{"orgs": 2}},
		{service: "nflow", path: "/api/v1/ui/home/notifications", payload: map[string]any{"count": 7}},
	}, t)
	defer cleanup()

	runtime := NewRuntime(&http.Client{}, Options{Timeout: time.Second, Retries: 0}, urls)
	resp := runtime.Home(context.Background(), Metadata{
		CorrelationID: "corr-home",
		RequestID:     "req-home",
	})

	if resp.Status != "ok" {
		t.Fatalf("status = %s, want ok", resp.Status)
	}
	if len(resp.Degraded) > 0 {
		t.Fatalf("unexpected degraded: %d", len(resp.Degraded))
	}
	expectedKeys := []string{"workflow", "org", "notifications"}
	for _, key := range expectedKeys {
		if _, ok := resp.Data[key]; !ok {
			t.Fatalf("missing key in data: %s", key)
		}
	}
}

func TestContract_Home_PartialDegraded(t *testing.T) {
	t.Parallel()

	okServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		_ = json.NewEncoder(w).Encode(map[string]any{"ok": true})
	}))
	defer okServer.Close()

	failServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusBadGateway)
	}))
	defer failServer.Close()

	runtime := NewRuntime(&http.Client{}, Options{Timeout: time.Second, Retries: 0}, map[string]string{
		"workflow": okServer.URL,
		"orgflow":  failServer.URL,
		"nflow":    okServer.URL,
	})

	resp := runtime.Home(context.Background(), Metadata{
		CorrelationID: "corr-home-fail",
		RequestID:     "req-home-fail",
	})

	if resp.Status != "degraded" {
		t.Fatalf("status = %s, want degraded", resp.Status)
	}
	if len(resp.Degraded) != 1 {
		t.Fatalf("degraded count = %d, want 1", len(resp.Degraded))
	}
	if resp.Degraded[0].SourceService != "AprilOrgFlow" {
		t.Fatalf("degraded service = %s, want AprilOrgFlow", resp.Degraded[0].SourceService)
	}
}

func TestContract_Summary_AllDownstreamOK(t *testing.T) {
	t.Parallel()

	urls, cleanup := setupMockServers([]mockDownstream{
		{service: "report", path: "/api/v1/ui/summary/report", payload: map[string]any{"reports": 3}},
		{service: "workflow", path: "/api/v1/ui/summary/workflow", payload: map[string]any{"completed": 12}},
		{service: "profil", path: "/api/v1/ui/summary/profile", payload: map[string]any{"level": 5}},
	}, t)
	defer cleanup()

	runtime := NewRuntime(&http.Client{}, Options{Timeout: time.Second, Retries: 0}, urls)
	resp := runtime.Summary(context.Background(), Metadata{
		CorrelationID: "corr-summary",
		RequestID:     "req-summary",
	})

	if resp.Status != "ok" {
		t.Fatalf("status = %s, want ok", resp.Status)
	}
	if len(resp.Degraded) > 0 {
		t.Fatalf("unexpected degraded: %d", len(resp.Degraded))
	}
	expectedKeys := []string{"report", "workflow", "profile"}
	for _, key := range expectedKeys {
		if _, ok := resp.Data[key]; !ok {
			t.Fatalf("missing key in data: %s", key)
		}
	}
}

func TestContract_Summary_PartialDegraded(t *testing.T) {
	t.Parallel()

	okServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		_ = json.NewEncoder(w).Encode(map[string]any{"ok": true})
	}))
	defer okServer.Close()

	failServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusNotFound)
	}))
	defer failServer.Close()

	runtime := NewRuntime(&http.Client{}, Options{Timeout: time.Second, Retries: 0}, map[string]string{
		"report":   failServer.URL,
		"workflow": okServer.URL,
		"profil":   failServer.URL,
	})

	resp := runtime.Summary(context.Background(), Metadata{
		CorrelationID: "corr-summary-fail",
		RequestID:     "req-summary-fail",
	})

	if resp.Status != "degraded" {
		t.Fatalf("status = %s, want degraded", resp.Status)
	}
	if len(resp.Degraded) != 2 {
		t.Fatalf("degraded count = %d, want 2", len(resp.Degraded))
	}
	if _, ok := resp.Data["workflow"]; !ok {
		t.Fatal("workflow should still be present")
	}
}

func TestContract_ResponseEnvelope_JSONStructure(t *testing.T) {
	t.Parallel()

	okServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		_ = json.NewEncoder(w).Encode(map[string]any{"data": "payload"})
	}))
	defer okServer.Close()

	runtime := NewRuntime(&http.Client{}, Options{Timeout: time.Second, Retries: 0}, map[string]string{
		"workflow": okServer.URL,
		"nflow":    okServer.URL,
		"profil":   okServer.URL,
	})

	resp := runtime.Dashboard(context.Background(), Metadata{
		CorrelationID: "corr-json",
		RequestID:     "req-json",
	})

	raw, err := json.Marshal(resp)
	if err != nil {
		t.Fatalf("marshal response envelope: %v", err)
	}

	var decoded map[string]any
	if err := json.Unmarshal(raw, &decoded); err != nil {
		t.Fatalf("unmarshal response envelope: %v", err)
	}

	if decoded["status"] != "ok" {
		t.Fatalf("status = %v, want ok", decoded["status"])
	}
	if _, ok := decoded["data"]; !ok {
		t.Fatal("missing data field in JSON")
	}
	if _, ok := decoded["metadata"]; !ok {
		t.Fatal("missing metadata field in JSON")
	}

	meta := decoded["metadata"].(map[string]any)
	if meta["correlationId"] != "corr-json" {
		t.Fatalf("correlationId = %v, want corr-json", meta["correlationId"])
	}
	if meta["requestId"] != "req-json" {
		t.Fatalf("requestId = %v, want req-json", meta["requestId"])
	}
	if meta["sourceService"] != "hub-bff" {
		t.Fatalf("sourceService = %v, want hub-bff", meta["sourceService"])
	}
}

func TestContract_ResponseEnvelope_Degraded_JSONFieldPresent(t *testing.T) {
	t.Parallel()

	failServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusServiceUnavailable)
	}))
	defer failServer.Close()

	runtime := NewRuntime(&http.Client{}, Options{Timeout: time.Second, Retries: 0}, map[string]string{
		"workflow": failServer.URL,
		"nflow":    failServer.URL,
		"profil":   failServer.URL,
	})

	resp := runtime.Dashboard(context.Background(), Metadata{
		CorrelationID: "corr-deg-json",
		RequestID:     "req-deg-json",
	})

	raw, err := json.Marshal(resp)
	if err != nil {
		t.Fatalf("marshal: %v", err)
	}

	var decoded map[string]any
	if err := json.Unmarshal(raw, &decoded); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}

	degraded, ok := decoded["degraded"]
	if !ok {
		t.Fatal("degraded field missing from JSON response")
	}
	degradedList, ok := degraded.([]any)
	if !ok {
		t.Fatalf("degraded is not array, got %T", degraded)
	}
	if len(degradedList) != 3 {
		t.Fatalf("degraded length = %d, want 3", len(degradedList))
	}
}

func TestContract_All10DownstreamPaths_Reachable(t *testing.T) {
	t.Parallel()

	var receivedPaths []string
	mu := &struct{}{}

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_ = mu
		receivedPaths = append(receivedPaths, r.URL.Path)
		_ = json.NewEncoder(w).Encode(map[string]any{"ok": true})
	}))
	defer server.Close()

	runtime := NewRuntime(&http.Client{}, Options{Timeout: time.Second, Retries: 0}, map[string]string{
		"workflow": server.URL,
		"nflow":    server.URL,
		"orgflow":  server.URL,
		"profil":   server.URL,
		"report":   server.URL,
	})

	_ = runtime.Dashboard(context.Background(), Metadata{})
	_ = runtime.Home(context.Background(), Metadata{})
	_ = runtime.Summary(context.Background(), Metadata{})

	expectedPaths := map[string]bool{
		"/api/v1/ui/dashboard/workflow":      false,
		"/api/v1/ui/dashboard/notifications": false,
		"/api/v1/ui/dashboard/profile":       false,
		"/api/v1/ui/home/workflow":           false,
		"/api/v1/ui/home/org":                false,
		"/api/v1/ui/home/notifications":      false,
		"/api/v1/ui/summary/report":          false,
		"/api/v1/ui/summary/workflow":        false,
		"/api/v1/ui/summary/profile":         false,
	}

	for _, path := range receivedPaths {
		expectedPaths[path] = true
	}

	for path, seen := range expectedPaths {
		if !seen {
			t.Errorf("path was never called: %s", path)
		}
	}
	if len(receivedPaths) < 9 {
		t.Errorf("received %d paths, want at least 9", len(receivedPaths))
	}
}

func TestContract_DegradedMessageContainsMeaningfulInfo(t *testing.T) {
	t.Parallel()

	failServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusServiceUnavailable)
	}))
	defer failServer.Close()

	runtime := NewRuntime(&http.Client{}, Options{Timeout: time.Second, Retries: 0}, map[string]string{
		"workflow": failServer.URL,
		"nflow":    failServer.URL,
		"profil":   failServer.URL,
	})

	resp := runtime.Dashboard(context.Background(), Metadata{})

	for _, d := range resp.Degraded {
		if d.Message == "" {
			t.Errorf("empty message for degraded service %s", d.SourceService)
		}
		if d.Code == "" {
			t.Errorf("empty code for degraded service %s", d.SourceService)
		}
		if d.SourceService == "" {
			t.Error("empty sourceService in degraded entry")
		}
	}
}

func TestContract_DownstreamResponseSchema_ContainsExpectedKeys(t *testing.T) {
	t.Parallel()

	wfPayload := map[string]any{
		"totalTasks":     json.Number("5"),
		"completedTasks": json.Number("3"),
		"status":         "active",
	}
	notifPayload := map[string]any{
		"unread": json.Number("3"),
		"total":  json.Number("10"),
	}
	profPayload := map[string]any{
		"name":  "test-user",
		"email": "test@example.com",
		"roles": []string{"admin", "user"},
	}

	urls, cleanup := setupMockServers([]mockDownstream{
		{service: "workflow", path: "/api/v1/ui/dashboard/workflow", payload: wfPayload},
		{service: "nflow", path: "/api/v1/ui/dashboard/notifications", payload: notifPayload},
		{service: "profil", path: "/api/v1/ui/dashboard/profile", payload: profPayload},
	}, t)
	defer cleanup()

	runtime := NewRuntime(&http.Client{}, Options{Timeout: time.Second, Retries: 0}, urls)
	resp := runtime.Dashboard(context.Background(), Metadata{})

	wfData, ok := resp.Data["workflow"].(map[string]any)
	if !ok {
		t.Fatal("workflow data is not a map")
	}
	if _, ok := wfData["totalTasks"]; !ok {
		t.Fatal("missing totalTasks in workflow data")
	}

	notifData, ok := resp.Data["notifications"].(map[string]any)
	if !ok {
		t.Fatal("notifications data is not a map")
	}
	if _, ok := notifData["unread"]; !ok {
		t.Fatal("missing unread in notifications data")
	}

	profData, ok := resp.Data["profile"].(map[string]any)
	if !ok {
		t.Fatal("profile data is not a map")
	}
	if _, ok := profData["name"]; !ok {
		t.Fatal("missing name in profile data")
	}
	if _, ok := profData["roles"]; !ok {
		t.Fatal("missing roles in profile data")
	}
}

func TestContract_DownstreamReturnsNonObject_JSON(t *testing.T) {
	t.Parallel()

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`"just a string"`))
	}))
	defer server.Close()

	adapter := NewServiceAdapter(&http.Client{}, "AprilWorkFlow", server.URL, Options{
		Timeout: time.Second,
		Retries: 0,
	})
	_, err := adapter.Fetch(context.Background(), "/api/v1/ui/dashboard/workflow", Metadata{})
	if err == nil {
		t.Fatal("expected error for non-object JSON response")
	}
}

func TestContract_DownstreamReturnsJSONArray(t *testing.T) {
	t.Parallel()

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`[1, 2, 3]`))
	}))
	defer server.Close()

	adapter := NewServiceAdapter(&http.Client{}, "AprilWorkFlow", server.URL, Options{
		Timeout: time.Second,
		Retries: 0,
	})
	_, err := adapter.Fetch(context.Background(), "/api/v1/ui/dashboard/workflow", Metadata{})
	if err == nil {
		t.Fatal("expected error for array JSON response")
	}
}

func TestContract_Runtime_PreserveMetadataInEnvelope(t *testing.T) {
	t.Parallel()

	okServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		_ = json.NewEncoder(w).Encode(map[string]any{"ok": true})
	}))
	defer okServer.Close()

	runtime := NewRuntime(&http.Client{}, Options{Timeout: time.Second, Retries: 0}, map[string]string{
		"workflow": okServer.URL,
		"nflow":    okServer.URL,
		"profil":   okServer.URL,
	})

	corr := "unique-corr-id"
	reqID := "unique-req-id"
	resp := runtime.Dashboard(context.Background(), Metadata{
		CorrelationID: corr,
		RequestID:     reqID,
		SourceService: "hub-shell",
	})

	if resp.Metadata.CorrelationID != corr {
		t.Fatalf("correlationId = %s, want %s", resp.Metadata.CorrelationID, corr)
	}
	if resp.Metadata.RequestID != reqID {
		t.Fatalf("requestId = %s, want %s", resp.Metadata.RequestID, reqID)
	}
	if resp.Metadata.SourceService != "hub-bff" {
		t.Fatalf("sourceService = %s, want hub-bff", resp.Metadata.SourceService)
	}
}

func TestContract_Timeout_Downstream(t *testing.T) {
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

func TestContract_Retry_ThenSuccess(t *testing.T) {
	t.Parallel()

	attempts := 0
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		attempts++
		if attempts < 3 {
			w.WriteHeader(http.StatusServiceUnavailable)
			return
		}
		_ = json.NewEncoder(w).Encode(map[string]any{"recovered": true})
	}))
	defer server.Close()

	adapter := NewServiceAdapter(&http.Client{}, "AprilWorkFlow", server.URL, Options{
		Timeout: time.Second,
		Retries: 3,
	})
	data, err := adapter.Fetch(context.Background(), "/api/v1/ui/dashboard/workflow", Metadata{})
	if err != nil {
		t.Fatalf("unexpected error after retries: %v", err)
	}
	if attempts != 3 {
		t.Fatalf("attempts = %d, want 3", attempts)
	}
	if recovered, ok := data["recovered"]; !ok || recovered != true {
		t.Fatalf("recovered = %v, want true", data["recovered"])
	}
}

func TestContract_EmptyResponseBody(t *testing.T) {
	t.Parallel()

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{}`))
	}))
	defer server.Close()

	adapter := NewServiceAdapter(&http.Client{}, "AprilWorkFlow", server.URL, Options{
		Timeout: time.Second,
		Retries: 0,
	})
	data, err := adapter.Fetch(context.Background(), "/api/v1/ui/dashboard/workflow", Metadata{})
	if err != nil {
		t.Fatalf("unexpected error for empty object: %v", err)
	}
	if len(data) != 0 {
		t.Fatalf("expected empty map, got %d keys", len(data))
	}
}

func TestContract_DownstreamPath_PerService(t *testing.T) {
	t.Parallel()

	var capturedPaths []string
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		capturedPaths = append(capturedPaths, r.URL.Path)
		_ = json.NewEncoder(w).Encode(map[string]any{"ok": true})
	}))
	defer server.Close()

	allExpected := []struct {
		method string
		path   string
	}{
		{"Dashboard", "/api/v1/ui/dashboard/workflow"},
		{"Dashboard", "/api/v1/ui/dashboard/notifications"},
		{"Dashboard", "/api/v1/ui/dashboard/profile"},
		{"Home", "/api/v1/ui/home/workflow"},
		{"Home", "/api/v1/ui/home/org"},
		{"Home", "/api/v1/ui/home/notifications"},
		{"Summary", "/api/v1/ui/summary/report"},
		{"Summary", "/api/v1/ui/summary/workflow"},
		{"Summary", "/api/v1/ui/summary/profile"},
	}

	runtime := NewRuntime(&http.Client{}, Options{Timeout: time.Second, Retries: 0}, map[string]string{
		"workflow": server.URL,
		"nflow":    server.URL,
		"orgflow":  server.URL,
		"profil":   server.URL,
		"report":   server.URL,
	})

	_ = runtime.Dashboard(context.Background(), Metadata{})
	for _, ep := range allExpected[:3] {
		found := false
		for _, p := range capturedPaths {
			if p == ep.path {
				found = true
				break
			}
		}
		if !found {
			t.Errorf("Dashboard path not hit: %s", ep.path)
		}
	}

	capturedPaths = nil
	_ = runtime.Home(context.Background(), Metadata{})
	for _, ep := range allExpected[3:6] {
		found := false
		for _, p := range capturedPaths {
			if p == ep.path {
				found = true
				break
			}
		}
		if !found {
			t.Errorf("Home path not hit: %s", ep.path)
		}
	}

	capturedPaths = nil
	_ = runtime.Summary(context.Background(), Metadata{})
	for _, ep := range allExpected[6:] {
		found := false
		for _, p := range capturedPaths {
			if p == ep.path {
				found = true
				break
			}
		}
		if !found {
			t.Errorf("Summary path not hit: %s", ep.path)
		}
	}
	_ = fmt.Sprintf
}

func TestContract_ComposeResponse_StatusTransition(t *testing.T) {
	t.Parallel()

	okServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		_ = json.NewEncoder(w).Encode(map[string]any{"ok": true})
	}))
	defer okServer.Close()

	failServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusBadGateway)
	}))
	defer failServer.Close()

	md := Metadata{
		CorrelationID: "corr-compose",
		RequestID:     "req-compose",
	}

	okRuntime := NewRuntime(&http.Client{}, Options{Timeout: time.Second, Retries: 0}, map[string]string{
		"workflow": okServer.URL,
		"nflow":    okServer.URL,
		"profil":   okServer.URL,
	})
	mixedRuntime := NewRuntime(&http.Client{}, Options{Timeout: time.Second, Retries: 0}, map[string]string{
		"workflow": okServer.URL,
		"nflow":    failServer.URL,
		"profil":   okServer.URL,
	})
	failRuntime := NewRuntime(&http.Client{}, Options{Timeout: time.Second, Retries: 0}, map[string]string{
		"workflow": failServer.URL,
		"nflow":    failServer.URL,
		"profil":   failServer.URL,
	})

	okResp := okRuntime.Dashboard(context.Background(), md)
	if okResp.Status != "ok" {
		t.Fatalf("all OK case: status = %s, want ok", okResp.Status)
	}
	if len(okResp.Degraded) != 0 {
		t.Fatalf("all OK case: degraded = %d, want 0", len(okResp.Degraded))
	}

	mixedResp := mixedRuntime.Dashboard(context.Background(), md)
	if mixedResp.Status != "degraded" {
		t.Fatalf("mixed case: status = %s, want degraded", mixedResp.Status)
	}
	if len(mixedResp.Degraded) != 1 {
		t.Fatalf("mixed case: degraded = %d, want 1", len(mixedResp.Degraded))
	}
	if len(mixedResp.Data) != 2 {
		t.Fatalf("mixed case: data keys = %d, want 2", len(mixedResp.Data))
	}

	failResp := failRuntime.Dashboard(context.Background(), md)
	if failResp.Status != "degraded" {
		t.Fatalf("all fail case: status = %s, want degraded", failResp.Status)
	}
	if len(failResp.Degraded) != 3 {
		t.Fatalf("all fail case: degraded = %d, want 3", len(failResp.Degraded))
	}
	if len(failResp.Data) != 0 {
		t.Fatalf("all fail case: data keys = %d, want 0", len(failResp.Data))
	}
}
