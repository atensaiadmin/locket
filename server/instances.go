package main

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

// HealthStatus is the live status of one instance.
type HealthStatus struct {
	Healthy   bool   `json:"healthy"`
	Message   string `json:"message,omitempty"`
	CheckedAt string `json:"checked_at"`
}

// checkHealth pings PocketBase's public /api/health endpoint.
// This is the ONLY PocketBase API surface Locket depends on (see wiki/integration.md).
func checkHealth(ctx context.Context, p Project, timeout time.Duration) HealthStatus {
	ctx, cancel := context.WithTimeout(ctx, timeout)
	defer cancel()

	url := fmt.Sprintf("http://127.0.0.1:%s/api/health", p.Port)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return HealthStatus{Healthy: false, Message: err.Error(), CheckedAt: nowRFC3339()}
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return HealthStatus{Healthy: false, Message: err.Error(), CheckedAt: nowRFC3339()}
	}
	defer resp.Body.Close()

	var body struct {
		Code int `json:"code"`
	}
	_ = json.NewDecoder(resp.Body).Decode(&body)

	healthy := resp.StatusCode == http.StatusOK && body.Code == 200
	msg := fmt.Sprintf("HTTP %d", resp.StatusCode)
	if healthy {
		msg = "ok"
	}
	return HealthStatus{Healthy: healthy, Message: msg, CheckedAt: nowRFC3339()}
}

func nowRFC3339() string {
	return time.Now().UTC().Format(time.RFC3339)
}
