package httpapi

import (
	"encoding/json"
	"log/slog"
	"net/http"

	"github.com/ukituki-ps/april-worker/hub-bff/internal/observability"
)

// CSPReportBody represents the JSON body of a CSP violation report.
// Based on https://w3c.github.io/webappsec-csp/#reportformat
type CSPReportBody struct {
	CSPReport CSPReport `json:"csp-report"`
}

type CSPReport struct {
	URI               string `json:"document-uri"`
	BlockedURL        string `json:"blocked-uri"`
	ViolatedDirective string `json:"violated-directive"`
	Disposition       string `json:"disposition"`
	StatusCode        int    `json:"status-code"`
	OriginalPolicy    string `json:"original-policy"`
	Referrer          string `json:"referrer"`
	SrcElement        string `json:"source-file"`
	LineNum           int    `json:"line-number"`
	EffectiveIntent   string `json:"effective-intent"`
	Sample            string `json:"sample"`
}

// CSReport handles POST /api/v1/csp-report — CSP violation report endpoint.
// This endpoint receives CSP violation reports from browsers and logs them.
func CSReport(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var report CSPReportBody
	if err := json.NewDecoder(r.Body).Decode(&report); err != nil {
		slog.Error("hub-bff csp-report decode error", "error", err)
		http.Error(w, "invalid report body", http.StatusBadRequest)
		return
	}

	md := MetadataFromContext(r.Context())
	slog.Warn("hub-bff csp violation received",
		"event", "csp_violation",
		"documentUri", report.CSPReport.URI,
		"blockedUri", report.CSPReport.BlockedURL,
		"violatedDirective", report.CSPReport.ViolatedDirective,
		"disposition", report.CSPReport.Disposition,
		"referrer", report.CSPReport.Referrer,
		"sourceFile", report.CSPReport.SrcElement,
		"lineNumber", report.CSPReport.LineNum,
		"sample", report.CSPReport.Sample,
		"correlationId", md.CorrelationID,
		"requestId", md.RequestID,
		"sourceService", "hub-bff",
	)

	observability.ObserveCSPViolation(report.CSPReport.URI, report.CSPReport.Disposition)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusAccepted)
	_ = json.NewEncoder(w).Encode(map[string]string{
		"status": "ok",
	})
}
