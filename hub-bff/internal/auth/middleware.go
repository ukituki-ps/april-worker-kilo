package auth

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"slices"
	"strings"
	"time"

	"github.com/MicahParks/keyfunc/v3"
	"github.com/golang-jwt/jwt/v5"
	"github.com/ukituki-ps/april-worker/hub-bff/internal/observability"
)

type realmAccess struct {
	Roles []string `json:"roles"`
}

type Claims struct {
	AZP               string      `json:"azp"`
	PreferredUsername string      `json:"preferred_username"`
	Email             string      `json:"email"`
	GivenName         string      `json:"given_name"`
	FamilyName        string      `json:"family_name"`
	Name              string      `json:"name"`
	RealmAccess       realmAccess `json:"realm_access"`
	jwt.RegisteredClaims
}

type Middleware struct {
	issuer   string
	audience string
	jwks     keyfunc.Keyfunc
}

func NewMiddleware(issuer, audience, jwksURL string) (*Middleware, error) {
	var (
		jwks keyfunc.Keyfunc
		err  error
	)
	for attempt := 1; attempt <= 60; attempt++ {
		jwks, err = keyfunc.NewDefaultCtx(context.Background(), []string{jwksURL})
		if err == nil {
			break
		}
		// Keycloak can be started in parallel with hub-bff in compose/CI.
		if attempt < 60 {
			time.Sleep(2 * time.Second)
		}
	}
	if err != nil {
		return nil, fmt.Errorf("create jwks client: %w", err)
	}

	return &Middleware{
		issuer:   issuer,
		audience: audience,
		jwks:     jwks,
	}, nil
}

type contextKey string

const claimsContextKey contextKey = "auth_claims"

type errorResponse struct {
	Code     string            `json:"code"`
	Message  string            `json:"message"`
	Metadata map[string]string `json:"metadata"`
}

func writeError(w http.ResponseWriter, r *http.Request, code int, appCode, message string) {
	correlationID := r.Header.Get("X-Correlation-Id")
	requestID := r.Header.Get("X-Request-Id")
	observability.ObserveAuthError(r.URL.Path, message, code)

	slog.Warn("hub-bff auth failed",
		"event", "auth_error",
		"path", r.URL.Path,
		"method", r.Method,
		"status", code,
		"reason", message,
		"correlationId", correlationID,
		"requestId", requestID,
		"sourceService", "hub-bff",
	)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	_ = json.NewEncoder(w).Encode(errorResponse{
		Code:    appCode,
		Message: message,
		Metadata: map[string]string{
			"correlationId": correlationID,
			"requestId":     requestID,
			"sourceService": "hub-bff",
		},
	})
}

func ClaimsFromContext(ctx context.Context) (*Claims, bool) {
	claims, ok := ctx.Value(claimsContextKey).(*Claims)
	return claims, ok
}

func (m *Middleware) Validate(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if !strings.HasPrefix(authHeader, "Bearer ") {
			writeError(w, r, http.StatusUnauthorized, "unauthorized", "missing bearer token")
			return
		}
		tokenValue := strings.TrimPrefix(authHeader, "Bearer ")
		if tokenValue == "" {
			writeError(w, r, http.StatusUnauthorized, "unauthorized", "missing bearer token")
			return
		}

		claims := &Claims{}
		_, err := jwt.ParseWithClaims(tokenValue, claims, m.jwks.Keyfunc,
			jwt.WithIssuer(m.issuer),
			jwt.WithValidMethods([]string{"RS256", "RS384", "RS512"}),
			jwt.WithExpirationRequired(),
		)
		if err != nil {
			writeError(w, r, http.StatusUnauthorized, "unauthorized", "invalid token")
			return
		}

		if m.audience != "" && !slices.Contains(claims.Audience, m.audience) && claims.AZP != m.audience {
			writeError(w, r, http.StatusUnauthorized, "unauthorized", "invalid audience")
			return
		}

		ctx := context.WithValue(r.Context(), claimsContextKey, claims)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func RequireAnyRole(roles ...string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			claims, ok := ClaimsFromContext(r.Context())
			if !ok {
				writeError(w, r, http.StatusUnauthorized, "unauthorized", "missing auth context")
				return
			}

			for _, role := range claims.RealmAccess.Roles {
				if slices.Contains(roles, role) {
					next.ServeHTTP(w, r)
					return
				}
			}

			writeError(w, r, http.StatusForbidden, "forbidden", "insufficient role")
		})
	}
}
