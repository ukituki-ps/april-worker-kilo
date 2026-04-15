package httpapi

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/ukituki-ps/april-worker/hub-bff/internal/aggregation"
)

type fakeAggregationService struct{}

func (f fakeAggregationService) Dashboard(_ context.Context, md aggregation.Metadata) aggregation.ResponseEnvelope {
	return aggregation.ResponseEnvelope{
		Status: "ok",
		Data: map[string]any{
			"workflow": map[string]any{"count": 1},
		},
		Metadata: md,
	}
}

func (f fakeAggregationService) Home(_ context.Context, md aggregation.Metadata) aggregation.ResponseEnvelope {
	return aggregation.ResponseEnvelope{Status: "ok", Data: map[string]any{}, Metadata: md}
}

func (f fakeAggregationService) Summary(_ context.Context, md aggregation.Metadata) aggregation.ResponseEnvelope {
	return aggregation.ResponseEnvelope{Status: "ok", Data: map[string]any{}, Metadata: md}
}

func TestDashboardHappyPath(t *testing.T) {
	t.Parallel()

	handlers := NewHandlers(fakeAggregationService{})
	req := httptest.NewRequest(http.MethodGet, "/api/v1/aggregation/dashboard", nil)
	req = req.WithContext(context.WithValue(req.Context(), requestMetadataKey, aggregation.Metadata{
		CorrelationID: "corr-1",
		RequestID:     "req-1",
		SourceService: "hub-shell",
	}))
	rec := httptest.NewRecorder()

	handlers.Dashboard(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", rec.Code)
	}

	var got aggregation.ResponseEnvelope
	if err := json.Unmarshal(rec.Body.Bytes(), &got); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if got.Metadata.CorrelationID != "corr-1" {
		t.Fatalf("correlationId = %s, want corr-1", got.Metadata.CorrelationID)
	}
}

func TestOverviewCompatibilityPath(t *testing.T) {
	t.Parallel()

	handlers := NewHandlers(fakeAggregationService{})
	req := httptest.NewRequest(http.MethodGet, "/api/v1/overview", nil)
	req = req.WithContext(context.WithValue(req.Context(), requestMetadataKey, aggregation.Metadata{
		CorrelationID: "corr-1",
		RequestID:     "req-1",
		SourceService: "hub-shell",
	}))
	rec := httptest.NewRecorder()

	handlers.Overview(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", rec.Code)
	}

	var got struct {
		Status  string `json:"status"`
		Widgets []struct {
			ID    string `json:"id"`
			State string `json:"state"`
		} `json:"widgets"`
	}
	if err := json.Unmarshal(rec.Body.Bytes(), &got); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if got.Status == "" {
		t.Fatal("status must be present")
	}
	if len(got.Widgets) == 0 {
		t.Fatal("widgets must not be empty")
	}
}

func TestMeUnauthorizedWithoutClaims(t *testing.T) {
	t.Parallel()

	req := httptest.NewRequest(http.MethodGet, "/api/v1/me", nil)
	rec := httptest.NewRecorder()

	Me(rec, req)
	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("status = %d, want 401", rec.Code)
	}
}

func TestMetadataMiddlewarePropagation(t *testing.T) {
	t.Parallel()

	handler := Metadata(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		md := MetadataFromContext(r.Context())
		writeJSON(w, http.StatusOK, md)
	}))

	req := httptest.NewRequest(http.MethodGet, "/api/v1/aggregation/home", strings.NewReader(""))
	req.Header.Set("X-Correlation-Id", "corr-123")
	req.Header.Set("X-Request-Id", "req-123")
	rec := httptest.NewRecorder()

	handler.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", rec.Code)
	}
	var md aggregation.Metadata
	if err := json.Unmarshal(rec.Body.Bytes(), &md); err != nil {
		t.Fatalf("decode metadata response: %v", err)
	}
	if md.CorrelationID != "corr-123" || md.RequestID != "req-123" {
		t.Fatalf("metadata propagation failed: %+v", md)
	}
}
