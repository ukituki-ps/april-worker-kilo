package observability

import (
	"strconv"
	"sync"
	"time"

	"github.com/prometheus/client_golang/prometheus"
)

type Recorder interface {
	ObserveRequest(method, path string, status int, duration time.Duration)
	ObserveDownstream(service, path, result string, attempt int, duration time.Duration)
	ObserveDownstreamRetry(service, path string)
	ObserveDegraded(service, reason string)
	ObserveAuthError(path, reason string, status int)
	ObserveTimeoutBudgetExceeded(service, path string)
}

type noopRecorder struct{}

func (noopRecorder) ObserveRequest(string, string, int, time.Duration)            {}
func (noopRecorder) ObserveDownstream(string, string, string, int, time.Duration) {}
func (noopRecorder) ObserveDownstreamRetry(string, string)                        {}
func (noopRecorder) ObserveDegraded(string, string)                               {}
func (noopRecorder) ObserveAuthError(string, string, int)                         {}
func (noopRecorder) ObserveTimeoutBudgetExceeded(string, string)                  {}

var (
	recorderMu sync.RWMutex
	recorder   Recorder = noopRecorder{}
)

func SetRecorder(r Recorder) {
	recorderMu.Lock()
	defer recorderMu.Unlock()
	if r == nil {
		recorder = noopRecorder{}
		return
	}
	recorder = r
}

func getRecorder() Recorder {
	recorderMu.RLock()
	defer recorderMu.RUnlock()
	return recorder
}

func ObserveRequest(method, path string, status int, duration time.Duration) {
	getRecorder().ObserveRequest(method, path, status, duration)
}

func ObserveDownstream(service, path, result string, attempt int, duration time.Duration) {
	getRecorder().ObserveDownstream(service, path, result, attempt, duration)
}

func ObserveDownstreamRetry(service, path string) {
	getRecorder().ObserveDownstreamRetry(service, path)
}

func ObserveDegraded(service, reason string) {
	getRecorder().ObserveDegraded(service, reason)
}

func ObserveAuthError(path, reason string, status int) {
	getRecorder().ObserveAuthError(path, reason, status)
}

func ObserveTimeoutBudgetExceeded(service, path string) {
	getRecorder().ObserveTimeoutBudgetExceeded(service, path)
}

type PrometheusRecorder struct {
	requestTotal       *prometheus.CounterVec
	requestDuration    *prometheus.HistogramVec
	downstreamTotal    *prometheus.CounterVec
	downstreamDuration *prometheus.HistogramVec
	downstreamRetry    *prometheus.CounterVec
	degradedTotal      *prometheus.CounterVec
	authErrorTotal     *prometheus.CounterVec
	timeoutBudgetTotal *prometheus.CounterVec
}

func NewPrometheusRecorder(reg prometheus.Registerer) *PrometheusRecorder {
	r := &PrometheusRecorder{
		requestTotal: prometheus.NewCounterVec(prometheus.CounterOpts{
			Namespace: "hub_bff",
			Name:      "http_requests_total",
			Help:      "Total number of inbound HTTP requests.",
		}, []string{"method", "path", "status"}),
		requestDuration: prometheus.NewHistogramVec(prometheus.HistogramOpts{
			Namespace: "hub_bff",
			Name:      "http_request_duration_seconds",
			Help:      "Duration of inbound HTTP requests.",
			Buckets:   prometheus.DefBuckets,
		}, []string{"method", "path", "status"}),
		downstreamTotal: prometheus.NewCounterVec(prometheus.CounterOpts{
			Namespace: "hub_bff",
			Name:      "downstream_requests_total",
			Help:      "Total number of downstream requests.",
		}, []string{"service", "path", "result", "attempt"}),
		downstreamDuration: prometheus.NewHistogramVec(prometheus.HistogramOpts{
			Namespace: "hub_bff",
			Name:      "downstream_request_duration_seconds",
			Help:      "Duration of downstream requests.",
			Buckets:   prometheus.DefBuckets,
		}, []string{"service", "path", "result"}),
		downstreamRetry: prometheus.NewCounterVec(prometheus.CounterOpts{
			Namespace: "hub_bff",
			Name:      "downstream_retries_total",
			Help:      "Total retries for downstream calls.",
		}, []string{"service", "path"}),
		degradedTotal: prometheus.NewCounterVec(prometheus.CounterOpts{
			Namespace: "hub_bff",
			Name:      "degraded_events_total",
			Help:      "Total number of degraded mode events.",
		}, []string{"service", "reason"}),
		authErrorTotal: prometheus.NewCounterVec(prometheus.CounterOpts{
			Namespace: "hub_bff",
			Name:      "auth_errors_total",
			Help:      "Total authentication and authorization errors.",
		}, []string{"path", "reason", "status"}),
		timeoutBudgetTotal: prometheus.NewCounterVec(prometheus.CounterOpts{
			Namespace: "hub_bff",
			Name:      "downstream_timeout_budget_exceeded_total",
			Help:      "Total number of downstream timeout budget exceed events.",
		}, []string{"service", "path"}),
	}

	reg.MustRegister(
		r.requestTotal,
		r.requestDuration,
		r.downstreamTotal,
		r.downstreamDuration,
		r.downstreamRetry,
		r.degradedTotal,
		r.authErrorTotal,
		r.timeoutBudgetTotal,
	)

	return r
}

func (r *PrometheusRecorder) ObserveRequest(method, path string, status int, duration time.Duration) {
	statusLabel := prometheus.Labels{
		"method": method,
		"path":   path,
		"status": prometheusLabelInt(status),
	}
	r.requestTotal.With(statusLabel).Inc()
	r.requestDuration.With(statusLabel).Observe(duration.Seconds())
}

func (r *PrometheusRecorder) ObserveDownstream(service, path, result string, attempt int, duration time.Duration) {
	r.downstreamTotal.With(prometheus.Labels{
		"service": service,
		"path":    path,
		"result":  result,
		"attempt": prometheusLabelInt(attempt),
	}).Inc()
	r.downstreamDuration.With(prometheus.Labels{
		"service": service,
		"path":    path,
		"result":  result,
	}).Observe(duration.Seconds())
}

func (r *PrometheusRecorder) ObserveDownstreamRetry(service, path string) {
	r.downstreamRetry.WithLabelValues(service, path).Inc()
}

func (r *PrometheusRecorder) ObserveDegraded(service, reason string) {
	r.degradedTotal.WithLabelValues(service, reason).Inc()
}

func (r *PrometheusRecorder) ObserveAuthError(path, reason string, status int) {
	r.authErrorTotal.WithLabelValues(path, reason, prometheusLabelInt(status)).Inc()
}

func (r *PrometheusRecorder) ObserveTimeoutBudgetExceeded(service, path string) {
	r.timeoutBudgetTotal.WithLabelValues(service, path).Inc()
}

func prometheusLabelInt(value int) string {
	return prometheusLabelInt64(int64(value))
}

func prometheusLabelInt64(value int64) string {
	return strconv.FormatInt(value, 10)
}
