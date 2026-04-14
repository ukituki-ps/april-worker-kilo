package httpapi

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/ukituki-ps/april-worker/hub-bff/internal/auth"
)

func Healthz(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func Readyz(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{
		"status":    "ready",
		"timestamp": time.Now().UTC().Format(time.RFC3339),
	})
}

func Overview(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]any{
		"status": "degraded",
		"widgets": []map[string]string{
			{"id": "tasks", "state": "pending-integration"},
		},
	})
}

func Me(w http.ResponseWriter, r *http.Request) {
	claims, ok := auth.ClaimsFromContext(r.Context())
	if !ok {
		authError(w, http.StatusUnauthorized, "unauthorized", "missing auth context")
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

func authError(w http.ResponseWriter, code int, appCode, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	_ = json.NewEncoder(w).Encode(map[string]string{
		"code":    appCode,
		"message": message,
	})
}

func writeJSON(w http.ResponseWriter, code int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	_ = json.NewEncoder(w).Encode(payload)
}
