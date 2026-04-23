package httpapi

import (
	"encoding/json"
	"net/http"
	"net/http/httputil"
	"net/url"
	"strings"
)

const adminProfileProxyPrefix = "/api/v1/admin/profile"

func NewProfileAdminProxy(baseURL string) (http.Handler, error) {
	trimmedBaseURL := strings.TrimSpace(baseURL)
	if trimmedBaseURL == "" {
		return http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
			writeProxyError(w, http.StatusServiceUnavailable, "profile admin upstream is not configured")
		}), nil
	}

	upstreamURL, err := url.Parse(trimmedBaseURL)
	if err != nil {
		return nil, err
	}

	proxy := httputil.NewSingleHostReverseProxy(upstreamURL)
	proxy.Director = func(req *http.Request) {
		remainder := strings.TrimPrefix(req.URL.Path, adminProfileProxyPrefix)
		if remainder == "" {
			remainder = "/"
		}
		req.URL.Scheme = upstreamURL.Scheme
		req.URL.Host = upstreamURL.Host
		req.URL.Path = singleSlashPath(upstreamURL.Path, remainder)
		req.Host = upstreamURL.Host

		md := MetadataFromContext(req.Context())
		req.Header.Set("X-Correlation-Id", md.CorrelationID)
		req.Header.Set("X-Request-Id", md.RequestID)
		req.Header.Set("X-Source-Service", "hub-bff")
	}

	proxy.ErrorHandler = func(w http.ResponseWriter, _ *http.Request, _ error) {
		writeProxyError(w, http.StatusBadGateway, "profile admin upstream is unavailable")
	}

	return proxy, nil
}

func singleSlashPath(basePath, remainder string) string {
	left := strings.TrimRight(basePath, "/")
	right := "/" + strings.TrimLeft(remainder, "/")
	return left + right
}

func writeProxyError(w http.ResponseWriter, statusCode int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	_ = json.NewEncoder(w).Encode(map[string]string{
		"code":    "proxy_error",
		"message": message,
	})
}
