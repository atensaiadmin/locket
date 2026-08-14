package main

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
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
	update := latest != "" && Version != "dev" && semverCompare(latest, Version) > 0
	writeJSON(w, http.StatusOK, VersionInfo{
		Version:         Version,
		Latest:          latest,
		UpdateAvailable: update,
	})
}

// semverCompare returns -1, 0 or 1 comparing two "vX.Y.Z" version strings
// numerically (major/minor/patch). If either side isn't parseable as X.Y.Z it
// falls back to plain equality so odd inputs never crash the check.
func semverCompare(a, b string) int {
	pa, pb := parseVersion(a), parseVersion(b)
	if pa == nil || pb == nil {
		if a == b {
			return 0
		}
		return -1
	}
	for i := 0; i < 3; i++ {
		if pa[i] < pb[i] {
			return -1
		}
		if pa[i] > pb[i] {
			return 1
		}
	}
	return 0
}

// parseVersion splits "vX.Y.Z" (or "X.Y.Z") into [major, minor, patch].
func parseVersion(v string) []int {
	v = strings.TrimPrefix(v, "v")
	parts := strings.Split(v, ".")
	if len(parts) != 3 {
		return nil
	}
	out := make([]int, 3)
	for i, p := range parts {
		n, err := strconv.Atoi(p)
		if err != nil {
			return nil
		}
		out[i] = n
	}
	return out
}
