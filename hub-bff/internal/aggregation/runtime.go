package aggregation

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"sync"
	"time"
)

const bffSourceService = "hub-bff"

type Metadata struct {
	CorrelationID string `json:"correlationId"`
	RequestID     string `json:"requestId"`
	SourceService string `json:"sourceService"`
}

type DegradedSource struct {
	SourceService string `json:"sourceService"`
	Code          string `json:"code"`
	Message       string `json:"message"`
}

type ResponseEnvelope struct {
	Status   string           `json:"status"`
	Data     map[string]any   `json:"data"`
	Degraded []DegradedSource `json:"degraded,omitempty"`
	Metadata Metadata         `json:"metadata"`
}

type Options struct {
	Timeout time.Duration
	Retries int
}

type Runtime struct {
	workflow *ServiceAdapter
	nflow    *ServiceAdapter
	orgflow  *ServiceAdapter
	profil   *ServiceAdapter
	report   *ServiceAdapter
}

func NewRuntime(client *http.Client, opts Options, serviceURLs map[string]string) *Runtime {
	return &Runtime{
		workflow: NewServiceAdapter(client, "AprilWorkFlow", serviceURLs["workflow"], opts),
		nflow:    NewServiceAdapter(client, "AprilNFlow", serviceURLs["nflow"], opts),
		orgflow:  NewServiceAdapter(client, "AprilOrgFlow", serviceURLs["orgflow"], opts),
		profil:   NewServiceAdapter(client, "AprilProfil", serviceURLs["profil"], opts),
		report:   NewServiceAdapter(client, "AprilReport", serviceURLs["report"], opts),
	}
}

func (r *Runtime) Dashboard(ctx context.Context, md Metadata) ResponseEnvelope {
	sources := []sourceCall{
		{name: "workflow", adapter: r.workflow, path: "/api/v1/ui/dashboard/workflow"},
		{name: "notifications", adapter: r.nflow, path: "/api/v1/ui/dashboard/notifications"},
		{name: "profile", adapter: r.profil, path: "/api/v1/ui/dashboard/profile"},
	}
	return composeResponse(ctx, md, sources)
}

func (r *Runtime) Home(ctx context.Context, md Metadata) ResponseEnvelope {
	sources := []sourceCall{
		{name: "workflow", adapter: r.workflow, path: "/api/v1/ui/home/workflow"},
		{name: "org", adapter: r.orgflow, path: "/api/v1/ui/home/org"},
		{name: "notifications", adapter: r.nflow, path: "/api/v1/ui/home/notifications"},
	}
	return composeResponse(ctx, md, sources)
}

func (r *Runtime) Summary(ctx context.Context, md Metadata) ResponseEnvelope {
	sources := []sourceCall{
		{name: "report", adapter: r.report, path: "/api/v1/ui/summary/report"},
		{name: "workflow", adapter: r.workflow, path: "/api/v1/ui/summary/workflow"},
		{name: "profile", adapter: r.profil, path: "/api/v1/ui/summary/profile"},
	}
	return composeResponse(ctx, md, sources)
}

type sourceCall struct {
	name    string
	adapter *ServiceAdapter
	path    string
}

func composeResponse(ctx context.Context, md Metadata, calls []sourceCall) ResponseEnvelope {
	type sourceResult struct {
		name string
		data map[string]any
		err  error
		src  string
	}

	out := make(chan sourceResult, len(calls))
	var wg sync.WaitGroup

	for _, call := range calls {
		call := call
		wg.Add(1)
		go func() {
			defer wg.Done()
			payload, err := call.adapter.Fetch(ctx, call.path, md)
			if err != nil {
				out <- sourceResult{name: call.name, err: err, src: call.adapter.name}
				return
			}
			out <- sourceResult{name: call.name, data: payload, src: call.adapter.name}
		}()
	}

	wg.Wait()
	close(out)

	data := make(map[string]any, len(calls))
	degraded := make([]DegradedSource, 0)
	for result := range out {
		if result.err != nil {
			degraded = append(degraded, DegradedSource{
				SourceService: result.src,
				Code:          "downstream_unavailable",
				Message:       result.err.Error(),
			})
			continue
		}
		data[result.name] = result.data
	}

	status := "ok"
	if len(degraded) > 0 {
		status = "degraded"
	}

	return ResponseEnvelope{
		Status:   status,
		Data:     data,
		Degraded: degraded,
		Metadata: Metadata{
			CorrelationID: md.CorrelationID,
			RequestID:     md.RequestID,
			SourceService: bffSourceService,
		},
	}
}

func parseJSONBody(body []byte) (map[string]any, error) {
	var payload map[string]any
	if err := json.Unmarshal(body, &payload); err != nil {
		return nil, errors.New("invalid downstream payload")
	}
	return payload, nil
}

func errorMessageFromStatus(status int, source string) string {
	return fmt.Sprintf("%s responded with status %d", source, status)
}
