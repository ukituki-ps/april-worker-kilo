package aggregation

import (
	"context"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

type ServiceAdapter struct {
	client  *http.Client
	name    string
	baseURL string
	timeout time.Duration
	retries int
}

func NewServiceAdapter(client *http.Client, name, baseURL string, opts Options) *ServiceAdapter {
	return &ServiceAdapter{
		client:  client,
		name:    name,
		baseURL: strings.TrimRight(baseURL, "/"),
		timeout: opts.Timeout,
		retries: opts.Retries,
	}
}

func (a *ServiceAdapter) Fetch(parentCtx context.Context, path string, metadata Metadata) (map[string]any, error) {
	if a.baseURL == "" {
		return nil, errors.New("service URL is not configured")
	}

	url := a.baseURL + path
	attempts := a.retries + 1
	var lastErr error
	for attempt := 1; attempt <= attempts; attempt++ {
		ctx, cancel := context.WithTimeout(parentCtx, a.timeout)
		req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
		if err != nil {
			cancel()
			return nil, fmt.Errorf("build downstream request: %w", err)
		}
		req.Header.Set("X-Correlation-Id", metadata.CorrelationID)
		req.Header.Set("X-Request-Id", metadata.RequestID)
		req.Header.Set("X-Source-Service", bffSourceService)

		res, err := a.client.Do(req)
		cancel()
		if err != nil {
			lastErr = err
			continue
		}

		body, readErr := io.ReadAll(res.Body)
		_ = res.Body.Close()
		if readErr != nil {
			lastErr = readErr
			continue
		}

		if res.StatusCode < http.StatusOK || res.StatusCode >= http.StatusMultipleChoices {
			lastErr = errors.New(errorMessageFromStatus(res.StatusCode, a.name))
			continue
		}

		payload, parseErr := parseJSONBody(body)
		if parseErr != nil {
			lastErr = parseErr
			continue
		}
		return payload, nil
	}

	if lastErr == nil {
		lastErr = errors.New("unknown downstream error")
	}
	return nil, lastErr
}
