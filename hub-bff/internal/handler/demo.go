package handler

import (
	"net/http"
)

// DemoHandler is a simple handler used to validate the SDE ↔ MDE delegation flow.
type DemoHandler struct{}

// Handle responds with a fixed JSON payload {"status":"ok","test":"delegation-ok"}.
func (h *DemoHandler) Handle(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"status":"ok","test":"delegation-ok"}`))
}
