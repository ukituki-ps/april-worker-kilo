package middleware

import "context"

// Limiter is the interface between rate limiting backends and the HTTP middleware.
type Limiter interface {
	// Allow checks whether the request identified by key is allowed.
	// Returns:
	//   allowed    - true if the request should proceed
	//   remaining  - number of requests left in the current window
	//   limit      - the configured limit for this tier
	//   retryAfter - seconds until the window resets (0 when allowed)
	Allow(ctx context.Context, key string) (allowed bool, remaining int, limit int, retryAfter int64)
}
