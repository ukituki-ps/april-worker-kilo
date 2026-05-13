package httpapi

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestAllowedMethods_Allowed(t *testing.T) {
	handler := AllowedMethods([]string{"GET"})(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))
	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", rec.Code)
	}
}

func TestAllowedMethods_Denied(t *testing.T) {
	handler := AllowedMethods([]string{"GET"})(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))
	req := httptest.NewRequest(http.MethodPost, "/test", nil)
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)
	if rec.Code != http.StatusMethodNotAllowed {
		t.Errorf("expected 405, got %d", rec.Code)
	}
	if rec.Header().Get("Allow") != "GET" {
		t.Errorf("expected Allow header = GET, got %s", rec.Header().Get("Allow"))
	}
}

func TestAllowedMethods_MultipleAllowed(t *testing.T) {
	for _, method := range []string{"GET", "PUT", "DELETE"} {
		handler := AllowedMethods([]string{"GET", "PUT", "DELETE"})(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusOK)
		}))
		req := httptest.NewRequest(method, "/test", nil)
		rec := httptest.NewRecorder()
		handler.ServeHTTP(rec, req)
		if rec.Code != http.StatusOK {
			t.Errorf("method %s: expected 200, got %d", method, rec.Code)
		}
	}
}
