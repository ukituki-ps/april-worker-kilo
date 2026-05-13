package httpapi

import (
	"context"
	"log/slog"
	"net/http"

	"github.com/ukituki-ps/april-worker/hub-bff/internal/auth"
)

// contextKey is a context key type to avoid collisions.
type contextKey string

const tenantKey contextKey = "tenant_id"

// GetTenantID extracts tenant_id from context.
// Returns "anon" if the context or tenant_id is not set.
func GetTenantID(ctx context.Context) string {
	if v, ok := ctx.Value(tenantKey).(string); ok && v != "" {
		return v
	}
	return "anon"
}

// TenantLogAttribute returns a slog.Attr for the current tenant from context.
func TenantLogAttribute(ctx context.Context) slog.Attr {
	return slog.String("tenant_id", GetTenantID(ctx))
}

// TenantContext attaches tenant_id from JWT claims to the request context.
// This middleware should be placed after the auth middleware so that
// claims are already available.
func TenantContext(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		tenantID := "anon"
		if claims, ok := auth.ClaimsFromContext(r.Context()); ok && claims.TenantID != "" {
			tenantID = claims.TenantID
		}
		ctx := context.WithValue(r.Context(), tenantKey, tenantID)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}
