package httpapi

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestGetTenantID_NoContext(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	id := GetTenantID(req.Context())
	if id != "anon" {
		t.Errorf("expected anon, got %s", id)
	}
}

func TestGetTenantID_EmptyTenant(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	ctx := req.Context()
	// context without tenant_key
	id := GetTenantID(ctx)
	_ = id
	if id != "anon" {
		t.Errorf("expected anon, got %s", id)
	}
}
