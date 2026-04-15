package httpapi

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"github.com/ukituki-ps/april-worker/hub-bff/internal/aggregation"
	"github.com/ukituki-ps/april-worker/hub-bff/internal/auth"
)

type AggregationService interface {
	Dashboard(ctx context.Context, md aggregation.Metadata) aggregation.ResponseEnvelope
	Home(ctx context.Context, md aggregation.Metadata) aggregation.ResponseEnvelope
	Summary(ctx context.Context, md aggregation.Metadata) aggregation.ResponseEnvelope
}

type Handlers struct {
	aggregation AggregationService
}

func NewHandlers(aggregationSvc AggregationService) *Handlers {
	return &Handlers{
		aggregation: aggregationSvc,
	}
}

func Healthz(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func Readyz(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{
		"status":    "ready",
		"timestamp": time.Now().UTC().Format(time.RFC3339),
	})
}

func (h *Handlers) Dashboard(w http.ResponseWriter, r *http.Request) {
	md := MetadataFromContext(r.Context())
	writeJSON(w, http.StatusOK, h.aggregation.Dashboard(r.Context(), md))
}

func (h *Handlers) Home(w http.ResponseWriter, r *http.Request) {
	md := MetadataFromContext(r.Context())
	writeJSON(w, http.StatusOK, h.aggregation.Home(r.Context(), md))
}

func (h *Handlers) Summary(w http.ResponseWriter, r *http.Request) {
	md := MetadataFromContext(r.Context())
	writeJSON(w, http.StatusOK, h.aggregation.Summary(r.Context(), md))
}

func Me(w http.ResponseWriter, r *http.Request) {
	claims, ok := auth.ClaimsFromContext(r.Context())
	if !ok {
		authError(w, r.Context(), http.StatusUnauthorized, "unauthorized", "missing auth context")
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"sub":      claims.Subject,
		"username": claims.PreferredUsername,
		"email":    claims.Email,
		"name":     claims.Name,
		"roles":    claims.RealmAccess.Roles,
	})
}

func AdminPing(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{
		"status": "ok",
	})
}

func authError(w http.ResponseWriter, ctx context.Context, code int, appCode, message string) {
	md := MetadataFromContext(ctx)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	_ = json.NewEncoder(w).Encode(map[string]any{
		"code":    appCode,
		"message": message,
		"metadata": map[string]string{
			"correlationId": md.CorrelationID,
			"requestId":     md.RequestID,
			"sourceService": "hub-bff",
		},
	})
}

func writeJSON(w http.ResponseWriter, code int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	_ = json.NewEncoder(w).Encode(payload)
}
