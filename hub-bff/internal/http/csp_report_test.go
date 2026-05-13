package httpapi

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestCSReport_POST_accepted(t *testing.T) {
	// Valid CSP report
	report := CSPReportBody{
		CSPReport: CSPReport{
			URI:               "https://dev.april.ukituki.tech/",
			BlockedURL:        "https://evil.com",
			Disposition:       "enforce",
			StatusCode:        0,
			ViolatedDirective: "script-src",
		},
	}

	body, _ := json.Marshal(report)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/csp-report", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	CSReport(w, req)

	if w.Code != http.StatusAccepted {
		t.Errorf("expected 202, got %d", w.Code)
	}

	var resp map[string]string
	_ = json.NewDecoder(w.Body).Decode(&resp)
	if resp["status"] != "ok" {
		t.Errorf("expected status=ok, got %s", resp["status"])
	}
}

func TestCSReport_GET_not_allowed(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/api/v1/csp-report", nil)
	w := httptest.NewRecorder()

	CSReport(w, req)

	if w.Code != http.StatusMethodNotAllowed {
		t.Errorf("expected 405, got %d", w.Code)
	}
}

func TestCSReport_invalid_body_bad_request(t *testing.T) {
	req := httptest.NewRequest(http.MethodPost, "/api/v1/csp-report", strings.NewReader("not-json"))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	CSReport(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
}

func TestCSReport_empty_body_bad_request(t *testing.T) {
	req := httptest.NewRequest(http.MethodPost, "/api/v1/csp-report", strings.NewReader(""))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	CSReport(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
}
