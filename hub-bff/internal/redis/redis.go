package redis

import (
	"context"
	"fmt"
	"log/slog"
	"time"

	"github.com/redis/go-redis/v9"
)

// Client wraps *redis.Client with a health-check ping.
type Client struct {
	redis *redis.Client
}

// New creates and verifies a Redis connection.
func New(ctx context.Context, host string, port string, password string) (*Client, error) {
	addr := fmt.Sprintf("%s:%s", host, port)
	rc := redis.NewClient(&redis.Options{
		Addr:         addr,
		Password:     password,
		DB:           0,
		DialTimeout:  3 * time.Second,
		ReadTimeout:  3 * time.Second,
		WriteTimeout: 3 * time.Second,
	})

	if err := rc.Ping(ctx).Err(); err != nil {
		return nil, fmt.Errorf("redis ping %s: %w", addr, err)
	}

	if password != "" {
		slog.Info("Redis connecting with password authentication", "host", addr)
	} else {
		slog.Warn("Redis connecting without password authentication", "host", addr)
	}

	return &Client{redis: rc}, nil
}

// Do delegates to the underlying redis client.
func (c *Client) Do(ctx context.Context, cmd redis.Cmder) redis.Cmder {
	return c.redis.Do(ctx, cmd)
}

// Eval executes a Lua script on the server.
func (c *Client) Eval(ctx context.Context, script string, keys []string, args ...interface{}) *redis.Cmd {
	return c.redis.Eval(ctx, script, keys, args...)
}

// Close closes the Redis connection.
func (c *Client) Close() error {
	return c.redis.Close()
}

// Pipeline returns a pipeliner for batch commands.
func (c *Client) Pipeline() redis.Pipeliner {
	return c.redis.Pipeline()
}

// Ping checks Redis connectivity.
func (c *Client) Ping(ctx context.Context) error {
	return c.redis.Ping(ctx).Err()
}
