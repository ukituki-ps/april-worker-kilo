package httpapi

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"net/http"
	"strings"

	"github.com/ukituki-ps/april-worker/hub-bff/internal/aggregation"
)

type metadataKey string

const requestMetadataKey metadataKey = "request_metadata"

func Metadata(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		md := aggregation.Metadata{
			CorrelationID: fromHeaderOrNew(r.Header.Get("X-Correlation-Id")),
			RequestID:     fromHeaderOrNew(r.Header.Get("X-Request-Id")),
			SourceService: fromHeaderOrDefault(r.Header.Get("X-Source-Service"), "hub-shell"),
		}

		w.Header().Set("X-Correlation-Id", md.CorrelationID)
		w.Header().Set("X-Request-Id", md.RequestID)
		w.Header().Set("X-Source-Service", "hub-bff")

		ctx := context.WithValue(r.Context(), requestMetadataKey, md)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func MetadataFromContext(ctx context.Context) aggregation.Metadata {
	md, ok := ctx.Value(requestMetadataKey).(aggregation.Metadata)
	if ok {
		return md
	}
	return aggregation.Metadata{
		CorrelationID: newID(),
		RequestID:     newID(),
		SourceService: "hub-shell",
	}
}

func fromHeaderOrDefault(value, fallback string) string {
	normalized := strings.TrimSpace(value)
	if normalized != "" {
		return normalized
	}
	return fallback
}

func fromHeaderOrNew(value string) string {
	normalized := strings.TrimSpace(value)
	if normalized != "" {
		return normalized
	}
	return newID()
}

func newID() string {
	buf := make([]byte, 16)
	if _, err := rand.Read(buf); err != nil {
		return "generated-id-unavailable"
	}
	return hex.EncodeToString(buf)
}
