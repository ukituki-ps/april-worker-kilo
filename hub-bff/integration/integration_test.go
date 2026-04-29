package integration_test

import (
	"context"
	"database/sql"
	"fmt"
	"net/url"
	"os"
	"os/exec"
	"path/filepath"
	"testing"
	"time"

	_ "github.com/lib/pq"
	"github.com/testcontainers/testcontainers-go"
	"github.com/testcontainers/testcontainers-go/wait"
)

func TestIntegrationAtlasMigrationFlow(t *testing.T) {
	t.Parallel()

	if _, err := exec.LookPath("atlas"); err != nil {
		t.Skip("atlas CLI is not installed; install it to run integration suite")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
	defer cancel()

	req := testcontainers.ContainerRequest{
		Image:        "postgres:16-alpine",
		ExposedPorts: []string{"5432/tcp"},
		Env: map[string]string{
			"POSTGRES_DB":       "aprilhub",
			"POSTGRES_USER":     "aprilhub",
			"POSTGRES_PASSWORD": "aprilhub",
		},
		WaitingFor: wait.ForLog("database system is ready to accept connections"),
	}
	pgContainer, err := testcontainers.GenericContainer(ctx, testcontainers.GenericContainerRequest{
		ContainerRequest: req,
		Started:          true,
	})
	if err != nil {
		t.Fatalf("start postgres container: %v", err)
	}
	t.Cleanup(func() {
		_ = pgContainer.Terminate(context.Background())
	})

	host, err := pgContainer.Host(ctx)
	if err != nil {
		t.Fatalf("get postgres host: %v", err)
	}
	// On some self-hosted runners "localhost" resolves to ::1 first and Atlas
	// intermittently gets connection resets against the mapped container port.
	if host == "localhost" {
		host = "127.0.0.1"
	}
	port, err := pgContainer.MappedPort(ctx, "5432")
	if err != nil {
		t.Fatalf("get postgres mapped port: %v", err)
	}
	databaseURL := (&url.URL{
		Scheme:   "postgres",
		User:     url.UserPassword("aprilhub", "aprilhub"),
		Host:     fmt.Sprintf("%s:%s", host, port.Port()),
		Path:     "/aprilhub",
		RawQuery: "sslmode=disable",
	}).String()

	migrationsDir := t.TempDir()
	sourceMigration := filepath.Join("testdata", "atlas", "202604170001_create_integration_probe.sql")
	payload, err := os.ReadFile(sourceMigration)
	if err != nil {
		t.Fatalf("read migration file: %v", err)
	}
	targetMigration := filepath.Join(migrationsDir, "202604170001_create_integration_probe.sql")
	if err := os.WriteFile(targetMigration, payload, 0o644); err != nil {
		t.Fatalf("write migration file: %v", err)
	}

	hashCmd := exec.CommandContext(ctx, "atlas", "migrate", "hash", "--dir", fmt.Sprintf("file://%s", migrationsDir))
	if output, err := hashCmd.CombinedOutput(); err != nil {
		t.Fatalf("atlas migrate hash failed: %v\n%s", err, string(output))
	}

	db, err := sql.Open("postgres", databaseURL)
	if err != nil {
		t.Fatalf("open db connection: %v", err)
	}
	defer db.Close()
	for attempt := 1; attempt <= 10; attempt++ {
		pingCtx, pingCancel := context.WithTimeout(ctx, 2*time.Second)
		pingErr := db.PingContext(pingCtx)
		pingCancel()
		if pingErr == nil {
			break
		}
		if attempt == 10 {
			t.Fatalf("postgres is not ready for ping: %v", pingErr)
		}
		time.Sleep(500 * time.Millisecond)
	}

	applyCmd := exec.CommandContext(
		ctx,
		"atlas",
		"migrate",
		"apply",
		"--dir",
		fmt.Sprintf("file://%s", migrationsDir),
		"--url",
		databaseURL,
	)
	var applyErr error
	var output []byte
	for attempt := 1; attempt <= 3; attempt++ {
		output, applyErr = applyCmd.CombinedOutput()
		if applyErr == nil {
			break
		}
		if attempt < 3 {
			time.Sleep(1 * time.Second)
			applyCmd = exec.CommandContext(
				ctx,
				"atlas",
				"migrate",
				"apply",
				"--dir",
				fmt.Sprintf("file://%s", migrationsDir),
				"--url",
				databaseURL,
			)
		}
	}
	if applyErr != nil {
		t.Fatalf("atlas migrate apply failed: %v\n%s", applyErr, string(output))
	}

	var tableName string
	if err := db.QueryRowContext(ctx, "select to_regclass('public.integration_probe')::text").Scan(&tableName); err != nil {
		t.Fatalf("query created table: %v", err)
	}
	if tableName != "integration_probe" {
		t.Fatalf("unexpected created table: %q", tableName)
	}
}
