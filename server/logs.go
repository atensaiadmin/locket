package main

import (
	"fmt"
	"os/exec"
	"strings"
)

// LogResult is the response for /api/instances/<name>/logs.
// "available:false" means Locket isn't running on a host with systemd/journalctl
// (e.g. local dev on macOS) — the UI shows a clear message instead of crashing.
type LogResult struct {
	Available bool     `json:"available"`
	Lines     []string `json:"lines,omitempty"`
	Message   string   `json:"message,omitempty"`
}

// fetchLogs returns recent journal lines for a PocketBase service.
//   - name:  project name (maps to systemd unit pocketbase-<name>)
//   - lines: max lines to return (default 100)
//   - level: optional journal priority filter: error | warn | info
//
// journalctl is systemd-only (Linux); on macOS it doesn't exist, so we return a
// graceful "server-only feature" result — this lets the UI be tested locally.
func fetchLogs(name string, lines int, level string) LogResult {
	if lines <= 0 {
		lines = 100
	}
	if lines > 5000 {
		lines = 5000
	}

	if _, err := exec.LookPath("journalctl"); err != nil {
		return LogResult{
			Available: false,
			Message:   "journalctl not found — logs are a server-only feature. Locket must run on the same host as PocketBase (systemd).",
		}
	}

	args := []string{"-u", "pocketbase-" + name, "-n", fmt.Sprintf("%d", lines), "--no-pager", "-o", "short-iso"}
	if prio, ok := map[string]string{"error": "err", "warn": "warning", "info": "info"}[level]; ok {
		args = append(args, "-p", prio)
	}

	out, err := exec.Command("journalctl", args...).CombinedOutput()
	if err != nil {
		return LogResult{Available: false, Message: err.Error()}
	}

	text := strings.TrimSpace(string(out))
	if text == "" {
		return LogResult{Available: true, Lines: []string{}}
	}
	return LogResult{Available: true, Lines: strings.Split(text, "\n")}
}
