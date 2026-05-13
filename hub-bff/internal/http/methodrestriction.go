package httpapi

import (
	"encoding/json"
	"net/http"
	"slices"
	"strings"
)

// AllowedMethods returns a middleware that restricts HTTP methods.
// If the request method is not in the allowed list, it returns 405 with Allow header.
func AllowedMethods(allowed []string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if !slices.Contains(allowed, r.Method) {
				w.Header().Set("Allow", strings.Join(allowed, ", "))
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusMethodNotAllowed)
				_ = json.NewEncoder(w).Encode(map[string]any{
					"code":    "method_not_allowed",
					"message": "метод не разрешён",
				})
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}
