package auth

import (
	"crypto/rand"
	"crypto/rsa"
	"encoding/base64"
	"encoding/json"
	"math/big"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

func TestValidateAndRoleGuards(t *testing.T) {
	t.Parallel()

	privateKey, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		t.Fatalf("generate rsa key: %v", err)
	}

	jwksServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		_ = json.NewEncoder(w).Encode(map[string]any{
			"keys": []map[string]any{
				{
					"kty": "RSA",
					"alg": "RS256",
					"use": "sig",
					"kid": "test-key",
					"n":   base64.RawURLEncoding.EncodeToString(privateKey.N.Bytes()),
					"e":   base64.RawURLEncoding.EncodeToString(big.NewInt(int64(privateKey.E)).Bytes()),
				},
			},
		})
	}))
	defer jwksServer.Close()

	mw, err := NewMiddleware("http://issuer/realms/april", "aprilhub-shell", jwksServer.URL)
	if err != nil {
		t.Fatalf("new middleware: %v", err)
	}

	tests := []struct {
		name       string
		token      string
		guard      func(http.Handler) http.Handler
		wantStatus int
	}{
		{
			name:       "missing bearer token",
			token:      "",
			wantStatus: http.StatusUnauthorized,
		},
		{
			name:       "invalid issuer",
			token:      mustToken(t, privateKey, tokenClaims("http://issuer/other", []string{"aprilhub-shell"}, "aprilhub-shell", []string{"user"}, time.Now().Add(5*time.Minute), time.Now().Add(-time.Minute))),
			wantStatus: http.StatusUnauthorized,
		},
		{
			name:       "invalid audience and azp",
			token:      mustToken(t, privateKey, tokenClaims("http://issuer/realms/april", []string{"other"}, "other", []string{"user"}, time.Now().Add(5*time.Minute), time.Now().Add(-time.Minute))),
			wantStatus: http.StatusUnauthorized,
		},
		{
			name:       "expired token",
			token:      mustToken(t, privateKey, tokenClaims("http://issuer/realms/april", []string{"aprilhub-shell"}, "aprilhub-shell", []string{"user"}, time.Now().Add(-time.Minute), time.Now().Add(-10*time.Minute))),
			wantStatus: http.StatusUnauthorized,
		},
		{
			name:       "future nbf",
			token:      mustToken(t, privateKey, tokenClaims("http://issuer/realms/april", []string{"aprilhub-shell"}, "aprilhub-shell", []string{"user"}, time.Now().Add(5*time.Minute), time.Now().Add(10*time.Minute))),
			wantStatus: http.StatusUnauthorized,
		},
		{
			name:       "insufficient role",
			token:      mustToken(t, privateKey, tokenClaims("http://issuer/realms/april", []string{"aprilhub-shell"}, "aprilhub-shell", []string{"user"}, time.Now().Add(5*time.Minute), time.Now().Add(-time.Minute))),
			guard:      RequireAnyRole("admin"),
			wantStatus: http.StatusForbidden,
		},
		{
			name:       "valid token and role",
			token:      mustToken(t, privateKey, tokenClaims("http://issuer/realms/april", []string{"aprilhub-shell"}, "aprilhub-shell", []string{"admin"}, time.Now().Add(5*time.Minute), time.Now().Add(-time.Minute))),
			guard:      RequireAnyRole("admin"),
			wantStatus: http.StatusOK,
		},
	}

	for _, tt := range tests {
		tt := tt
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()

			var base http.Handler = http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
				w.WriteHeader(http.StatusOK)
			})
			if tt.guard != nil {
				base = tt.guard(base)
			}

			handler := mw.Validate(base)
			req := httptest.NewRequest(http.MethodGet, "/api/v1/me", nil)
			if tt.token != "" {
				req.Header.Set("Authorization", "Bearer "+tt.token)
			}

			rec := httptest.NewRecorder()
			handler.ServeHTTP(rec, req)

			if rec.Code != tt.wantStatus {
				t.Fatalf("status = %d, want %d, body=%s", rec.Code, tt.wantStatus, rec.Body.String())
			}
		})
	}
}

func tokenClaims(iss string, aud []string, azp string, roles []string, exp time.Time, nbf time.Time) Claims {
	return Claims{
		AZP: azp,
		RealmAccess: realmAccess{
			Roles: roles,
		},
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   "dev-user",
			Issuer:    iss,
			Audience:  aud,
			ExpiresAt: jwt.NewNumericDate(exp),
			NotBefore: jwt.NewNumericDate(nbf),
			IssuedAt:  jwt.NewNumericDate(time.Now().Add(-time.Minute)),
		},
	}
}

func mustToken(t *testing.T, privateKey *rsa.PrivateKey, claims Claims) string {
	t.Helper()
	token := jwt.NewWithClaims(jwt.SigningMethodRS256, claims)
	token.Header["kid"] = "test-key"
	signed, err := token.SignedString(privateKey)
	if err != nil {
		t.Fatalf("sign token: %v", err)
	}
	return signed
}
