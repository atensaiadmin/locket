package main

import (
	"encoding/json"
	"net/http"
	"sync"
	"time"
)

// Version is set at build time via:
//   go build -ldflags "-X main.Version=v0.1.0"
// Default "dev" for local builds.
var Version = "dev"

// GitHub repo used for update checks.
const (
	repoOwner = "atensaiadmin"
	repoName  = "locket"
)

var (
	latestMu    sync.Mutex
	latestCache struct {
		version string
		at      time.Time
	}
)

// latestRelease returns the newest published release tag (e.g. "v0.2.0"),
// cached for 6h so we don't hammer the GitHub API on every page load.
func latestRelease() string {
	latestMu.Lock()
	defer latestMu.Unlock()

	if !latestCache.at.IsZero() && time.Since(latestCache.at) < 6*time.Hour {
		return latestCache.version
	}

	client := &http.Client{Timeout: 5 * time.Second}
	resp, err := client.Get("https://api.github.com/repos/" + repoOwner + "/" + repoName + "/releases/latest")
	if err == nil {
		defer resp.Body.Close()
		if resp.StatusCode == http.StatusOK {
			var r struct {
				TagName string `json:"tag_name"`
			}
			if json.NewDecoder(resp.Body).Decode(&r) == nil && r.TagName != "" {
				latestCache.version = r.TagName
			}
		}
	}
	latestCache.at = time.Now()
	return latestCache.version
}

// VersionInfo is the response for /api/version.
type VersionInfo struct {
	Version         string `json:"version"`
	Latest          string `json:"latest"`
	UpdateAvailable bool   `json:"update_available"`
}

// handleVersion returns the running version + whether a newer release exists.
func handleVersion(w http.ResponseWriter, r *http.Request) {
	latest := latestRelease()
	update := latest != "" && Version != "dev" && latest != Version
	writeJSON(w, http.StatusOK, VersionInfo{
		Version:         Version,
		Latest:          latest,
		UpdateAvailable: update,
	})
}
