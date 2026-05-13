package middleware

import (
	"context"
	"sync"
)

const defaultLimit = 5

// CountingRateLimiter позволяет первые limit вызовов Allow для каждого ключа.
type CountingRateLimiter struct {
	mu       sync.Mutex
	counters map[string]int
	limit    int
}

// NewCountingRateLimiter создаёт новый ограничитель. Если limit <= 0, используется 5.
func NewCountingRateLimiter(limit int) *CountingRateLimiter {
	if limit <= 0 {
		limit = defaultLimit
	}
	return &CountingRateLimiter{
		counters: make(map[string]int),
		limit:    limit,
	}
}

// Allow возвращает true для первых limit вызовов по ключу.
// Возвращает: allowed, remaining, limit, retryAfter.
func (l *CountingRateLimiter) Allow(ctx context.Context, key string) (bool, int, int, int64) {
	l.mu.Lock()
	defer l.mu.Unlock()
	if ctx.Err() != nil {
		return false, 0, l.limit, 1
	}
	cur := l.counters[key]
	if cur >= l.limit {
		return false, 0, l.limit, 1
	}
	l.counters[key] = cur + 1
	return true, l.limit - 1 - cur, l.limit, 0
}

// Reset сбрасывает все счётчики.
func (l *CountingRateLimiter) Reset() {
	l.mu.Lock()
	defer l.mu.Unlock()
	for k := range l.counters {
		delete(l.counters, k)
	}
}
