package aggregation

import (
	"context"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"strings"
	"time"

	"github.com/ukituki-ps/april-worker/hub-bff/internal/observability"
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
		attemptStart := time.Now()
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
			duration := time.Since(attemptStart)
			result := "transport_error"
			if errors.Is(err, context.DeadlineExceeded) {
				result = "timeout"
				observability.ObserveTimeoutBudgetExceeded(a.name, path)
			}
			observability.ObserveDownstream(a.name, path, result, attempt, duration)
			slog.Warn("hub-bff downstream call failed",
				"event", "downstream_call",
				"service", a.name,
				"path", path,
				"attempt", attempt,
				"result", result,
				"latencyMs", duration.Milliseconds(),
				"correlationId", metadata.CorrelationID,
				"requestId", metadata.RequestID,
			)
			lastErr = err
			if attempt < attempts {
				observability.ObserveDownstreamRetry(a.name, path)
			}
			continue
		}

		body, readErr := io.ReadAll(res.Body)
		_ = res.Body.Close()
		if readErr != nil {
			duration := time.Since(attemptStart)
			observability.ObserveDownstream(a.name, path, "read_error", attempt, duration)
			slog.Warn("hub-bff downstream body read failed",
				"event", "downstream_call",
				"service", a.name,
				"path", path,
				"attempt", attempt,
				"result", "read_error",
				"latencyMs", duration.Milliseconds(),
				"correlationId", metadata.CorrelationID,
				"requestId", metadata.RequestID,
			)
			lastErr = readErr
			if attempt < attempts {
				observability.ObserveDownstreamRetry(a.name, path)
			}
			continue
		}

		if res.StatusCode < http.StatusOK || res.StatusCode >= http.StatusMultipleChoices {
			duration := time.Since(attemptStart)
			observability.ObserveDownstream(a.name, path, "http_error", attempt, duration)
			slog.Warn("hub-bff downstream status not ok",
				"event", "downstream_call",
				"service", a.name,
				"path", path,
				"attempt", attempt,
				"result", "http_error",
				"status", res.StatusCode,
				"latencyMs", duration.Milliseconds(),
				"correlationId", metadata.CorrelationID,
				"requestId", metadata.RequestID,
			)
			lastErr = errors.New(errorMessageFromStatus(res.StatusCode, a.name))
			if attempt < attempts {
				observability.ObserveDownstreamRetry(a.name, path)
			}
			continue
		}

		payload, parseErr := parseJSONBody(body)
		if parseErr != nil {
			duration := time.Since(attemptStart)
			observability.ObserveDownstream(a.name, path, "parse_error", attempt, duration)
			slog.Warn("hub-bff downstream payload parse failed",
				"event", "downstream_call",
				"service", a.name,
				"path", path,
				"attempt", attempt,
				"result", "parse_error",
				"latencyMs", duration.Milliseconds(),
				"correlationId", metadata.CorrelationID,
				"requestId", metadata.RequestID,
			)
			lastErr = parseErr
			if attempt < attempts {
				observability.ObserveDownstreamRetry(a.name, path)
			}
			continue
		}
		duration := time.Since(attemptStart)
		observability.ObserveDownstream(a.name, path, "ok", attempt, duration)
		slog.Info("hub-bff downstream call succeeded",
			"event", "downstream_call",
			"service", a.name,
			"path", path,
			"attempt", attempt,
			"result", "ok",
			"latencyMs", duration.Milliseconds(),
			"correlationId", metadata.CorrelationID,
			"requestId", metadata.RequestID,
		)
		return payload, nil
	}

	if lastErr == nil {
		lastErr = errors.New("unknown downstream error")
	}
	return nil, lastErr
}
