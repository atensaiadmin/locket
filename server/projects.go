package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
)

var (
	projectNameRe   = regexp.MustCompile(`^[a-z][a-z0-9-]{1,62}$`)
	projectDomainRe = regexp.MustCompile(`^([a-z0-9-]+\.)+[a-z]{2,}$`)
)

// createProjectReq is the JSON body for POST /api/projects.
type createProjectReq struct {
	Name   string `json:"name"`
	Port   string `json:"port"`
	Domain string `json:"domain"`
}

// validateProjectInput sanity-checks the fields before anything touches disk.
func validateProjectInput(name, port, domain string) error {
	if !projectNameRe.MatchString(name) {
		return fmt.Errorf("invalid name %q — 2-63 chars, lowercase letters/digits/hyphens, must start with a letter", name)
	}
	n, err := strconv.Atoi(port)
	if err != nil || n < 1024 || n > 65535 {
		return fmt.Errorf("invalid port %q — use a number between 1024 and 65535", port)
	}
	if !projectDomainRe.MatchString(domain) {
		return fmt.Errorf("invalid domain %q — use a hostname like app.example.com", domain)
	}
	return nil
}

// handleCreateProject provisions a new PocketBase instance via add.sh.
// Route: POST /api/projects  (auth required)
func handleCreateProject(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]any{"error": "method not allowed"})
		return
	}

	var req createProjectReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": "invalid JSON body"})
		return
	}
	req.Name = strings.ToLower(strings.TrimSpace(req.Name))
	req.Port = strings.TrimSpace(req.Port)
	req.Domain = strings.ToLower(strings.TrimSpace(req.Domain))

	if err := validateProjectInput(req.Name, req.Port, req.Domain); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": err.Error()})
		return
	}

	// Reject duplicates against the live projects.conf.
	projects, err := loadProjects(*configPath)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]any{"error": err.Error()})
		return
	}
	for _, p := range projects {
		if p.Name == req.Name {
			writeJSON(w, http.StatusConflict, map[string]any{"error": "project already exists: " + req.Name})
			return
		}
		if p.Port == req.Port {
			writeJSON(w, http.StatusConflict, map[string]any{"error": "port already in use: " + req.Port})
			return
		}
	}

	// Run the provisioning script (whitelisted path, validated args).
	// Pass PB_HOME explicitly so the script uses the same home as the server
	// (--pbhome) instead of its own compiled-in default.
	script := filepath.Join(*pbHome, "scripts", "add.sh")
	cmd := exec.Command("bash", script, req.Name, req.Port, req.Domain)
	cmd.Env = append(os.Environ(), "PB_HOME="+*pbHome)
	out, err := cmd.CombinedOutput()
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]any{
			"error":  "add.sh failed: " + err.Error(),
			"output": string(out),
		})
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"ok": true, "output": string(out)})
}
