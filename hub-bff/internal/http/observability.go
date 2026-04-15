package httpapi

import (
	"log/slog"
	"net/http"
	"time"

	"github.com/ukituki-ps/april-worker/hub-bff/internal/observability"
)

type responseRecorder struct {
	http.ResponseWriter
	status int
}

func (r *responseRecorder) WriteHeader(code int) {
	r.status = code
	r.ResponseWriter.WriteHeader(code)
}

func AccessLog(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		rec := &responseRecorder{
			ResponseWriter: w,
			status:         http.StatusOK,
		}

		next.ServeHTTP(rec, r)

		duration := time.Since(start)
		md := MetadataFromContext(r.Context())
		observability.ObserveRequest(r.Method, r.URL.Path, rec.status, duration)

		fields := []any{
			"event", "request_completed",
			"method", r.Method,
			"path", r.URL.Path,
			"status", rec.status,
			"latencyMs", duration.Milliseconds(),
			"correlationId", md.CorrelationID,
			"requestId", md.RequestID,
			"sourceService", md.SourceService,
		}

		if rec.status == http.StatusUnauthorized || rec.status == http.StatusForbidden {
			slog.Warn("hub-bff auth request rejected", fields...)
			return
		}

		slog.Info("hub-bff request handled", fields...)
	})
}
