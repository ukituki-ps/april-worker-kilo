package auth

import (
	"context"
	"fmt"
	"net/http"
	"slices"
	"strings"

	"github.com/MicahParks/keyfunc/v3"
	"github.com/golang-jwt/jwt/v5"
)

type Claims struct {
	Roles []string `json:"roles"`
	AZP   string   `json:"azp"`
	jwt.RegisteredClaims
}

type Middleware struct {
	issuer   string
	audience string
	jwks     keyfunc.Keyfunc
}

func NewMiddleware(issuer, audience, jwksURL string) (*Middleware, error) {
	jwks, err := keyfunc.NewDefaultCtx(context.Background(), []string{jwksURL})
	if err != nil {
		return nil, fmt.Errorf("create jwks client: %w", err)
	}

	return &Middleware{
		issuer:   issuer,
		audience: audience,
		jwks:     jwks,
	}, nil
}

func (m *Middleware) Validate(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		tokenValue := strings.TrimPrefix(r.Header.Get("Authorization"), "Bearer ")
		if tokenValue == "" || tokenValue == r.Header.Get("Authorization") {
			http.Error(w, "missing bearer token", http.StatusUnauthorized)
			return
		}

		claims := &Claims{}
		_, err := jwt.ParseWithClaims(tokenValue, claims, m.jwks.Keyfunc,
			jwt.WithIssuer(m.issuer),
			jwt.WithValidMethods([]string{"RS256", "RS384", "RS512"}),
		)
		if err != nil {
			http.Error(w, "invalid token", http.StatusUnauthorized)
			return
		}

		if m.audience != "" && !slices.Contains(claims.Audience, m.audience) && claims.AZP != m.audience {
			http.Error(w, "invalid audience", http.StatusUnauthorized)
			return
		}

		next.ServeHTTP(w, r)
	})
}
