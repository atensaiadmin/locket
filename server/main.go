package main

import (
	"embed"
	"encoding/json"
	"flag"
	"fmt"
	"io/fs"
	"log"
	"net/http"
	"strings"
	"time"
)

//go:embed all:static
var staticFS embed.FS

var (
	configPath = flag.String("config", "/opt/pocketbase/projects.conf", "path to projects.conf")
	addr       = flag.String("addr", ":8090", "listen address")
	pbHome     = flag.String("pbhome", "/opt/pocketbase", "PocketBase home dir")
	authFile   = flag.String("auth-file", "/opt/locket/auth.json", "path to the access-key store")
)

func main() {
	flag.Parse()

	// Safety guard (closes the first-visit window): if no access key is set and
	// we'd bind all interfaces, refuse to start. Set a key first via the UI on
	// 127.0.0.1, or export LOCKET_TOKEN.
	if !keyIsSet() && addrBindsPublic(*addr) {
		log.Fatalf("no access key configured and %s binds all interfaces.\n"+
			"Set one by running on localhost and opening the setup screen, or export LOCKET_TOKEN=...", *addr)
	}

	http.HandleFunc("/api/health", handleLocketHealth)
	http.HandleFunc("/api/auth/status", handleAuthStatus)
	http.HandleFunc("/api/auth/setup", handleAuthSetup)
	http.HandleFunc("/api/auth/login", handleAuthLogin)
	http.HandleFunc("/api/version", requireAuth(handleVersion))
	http.HandleFunc("/api/instances", requireAuth(handleInstances))
	http.HandleFunc("/api/instances/", requireAuth(handleInstanceAction))
	http.HandleFunc("/api/history/", requireAuth(handleHistory))
	http.HandleFunc("/api/projects", requireAuth(handleCreateProject))

	// Serve the embedded web UI (built via build.sh → copied into server/static).
	staticRoot, _ := fs.Sub(staticFS, "static")
	http.Handle("/", http.FileServer(http.FS(staticRoot)))

	log.Printf("Locket listening on %s (config: %s)", *addr, *configPath)
	log.Fatal(http.ListenAndServe(*addr, nil))
}

func handleLocketHealth(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]any{"code": 200, "message": "Locket is healthy."})
}

// handleInstances returns every project with its live health status.
func handleInstances(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]any{"error": "method not allowed"})
		return
	}
	projects, err := loadProjects(*configPath)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]any{"error": err.Error()})
		return
	}

	type row struct {
		Project
		Health HealthStatus `json:"health"`
		Ops    OpsInfo      `json:"ops"`
	}
	rows := make([]row, 0, len(projects))
	for _, p := range projects {
		h := checkHealth(r.Context(), p, 3*time.Second)
		history.record(p.Name, h.Healthy) // passive status-history logging
		rows = append(rows, row{Project: p, Health: h, Ops: collectOps(p)})
	}
	writeJSON(w, http.StatusOK, rows)
}

// handleHistory returns the recorded health observations for one instance.
// Route: /api/history/<name>
func handleHistory(w http.ResponseWriter, r *http.Request) {
	name := strings.TrimPrefix(r.URL.Path, "/api/history/")
	if name == "" {
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": "missing project name"})
		return
	}
	projects, err := loadProjects(*configPath)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]any{"error": err.Error()})
		return
	}
	if _, ok := findProject(projects, name); !ok {
		writeJSON(w, http.StatusNotFound, map[string]any{"error": "unknown project: " + name})
		return
	}
	writeJSON(w, http.StatusOK, history.series(name))
}

// handleInstanceAction: /api/instances/<name>/logs (GET) | <name>/<action> (POST: deploy | restart)
func handleInstanceAction(w http.ResponseWriter, r *http.Request) {
	parts := strings.Split(strings.TrimPrefix(r.URL.Path, "/api/instances/"), "/")
	if len(parts) != 2 || parts[0] == "" || parts[1] == "" {
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": "expected /api/instances/<name>/logs or /api/instances/<name>/<action>"})
		return
	}
	name, action := parts[0], parts[1]

	projects, err := loadProjects(*configPath)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]any{"error": err.Error()})
		return
	}
	if _, ok := findProject(projects, name); !ok {
		writeJSON(w, http.StatusNotFound, map[string]any{"error": "unknown project: " + name})
		return
	}

	// GET .../logs?lines=100&level=error → journalctl output (graceful fallback)
	if action == "logs" && r.Method == http.MethodGet {
		lines := 100
		if v := r.URL.Query().Get("lines"); v != "" {
			fmt.Sscanf(v, "%d", &lines)
		}
		level := r.URL.Query().Get("level")
		writeJSON(w, http.StatusOK, fetchLogs(name, lines, level))
		return
	}

	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]any{"error": "method not allowed"})
		return
	}

	output, err := runAction(action, name)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]any{"error": err.Error(), "output": output})
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"ok": true, "output": output})
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}
