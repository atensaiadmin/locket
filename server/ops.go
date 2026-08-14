package main

import (
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
	"time"
)

// OpsInfo holds best-effort ops details for one instance. Every field degrades
// gracefully (zero/empty) when the underlying command isn't available — e.g.
// running Locket locally on macOS, or a project dir that doesn't exist yet.
type OpsInfo struct {
	Version       string `json:"version"`         // PocketBase binary version (shared per server)
	UptimeSeconds int64  `json:"uptime_seconds"`  // systemd ActiveEnter → now
	DiskBytes     int64  `json:"disk_bytes"`      // du of the instance folder
	DiskAvailable bool   `json:"disk_available"`
	LastBackup    string `json:"last_backup"` // RFC3339 of newest backup tarball ("" if none)
	BackupCount   int    `json:"backup_count"`
}

// backupDir is where backup.sh writes tarballs (must match scripts/backup.sh).
const backupDir = "/var/backups/pocketbase"

var cachedVersion string

// pocketBaseVersion runs `pocketbase --version` once and caches it (the binary
// is shared across all instances on the server).
func pocketBaseVersion() string {
	if cachedVersion != "" {
		return cachedVersion
	}
	bin := filepath.Join(*pbHome, "pocketbase")
	if _, err := os.Stat(bin); err != nil {
		return ""
	}
	out, err := exec.Command(bin, "--version").Output()
	if err != nil {
		return ""
	}
	cachedVersion = strings.TrimSpace(string(out))
	return cachedVersion
}

// instanceUptime returns seconds since the systemd unit started (0 if unknown).
func instanceUptime(p Project) int64 {
	out, err := exec.Command("systemctl", "show", "pocketbase-"+p.Name,
		"-p", "ActiveEnterTimestamp", "--value").Output()
	if err != nil {
		return 0
	}
	ts := strings.TrimSpace(string(out))
	if ts == "" {
		return 0
	}
	// systemd format: "Fri 2026-08-14 01:42:53 UTC"
	t, err := time.Parse("Mon 2006-01-02 15:04:05 MST", ts)
	if err != nil {
		return 0
	}
	d := time.Since(t).Seconds()
	if d < 0 {
		return 0
	}
	return int64(d)
}

// instanceDisk returns the on-disk size of the instance folder.
func instanceDisk(p Project) (int64, bool) {
	dir := filepath.Join(*pbHome, p.Name)
	out, err := exec.Command("du", "-sk", dir).Output()
	if err != nil {
		return 0, false
	}
	fields := strings.Fields(string(out))
	if len(fields) == 0 {
		return 0, false
	}
	kb, err := strconv.ParseInt(fields[0], 10, 64)
	if err != nil {
		return 0, false
	}
	return kb * 1024, true
}

// backupStatus finds the newest tarball for this instance in the backup dir.
func backupStatus(p Project) (last string, count int) {
	matches, err := filepath.Glob(filepath.Join(backupDir, p.Name+"_*.tar.gz"))
	if err != nil || len(matches) == 0 {
		return "", 0
	}
	var newest time.Time
	var newestPath string
	for _, m := range matches {
		if fi, err := os.Stat(m); err == nil {
			count++
			if fi.ModTime().After(newest) {
				newest = fi.ModTime()
				newestPath = m
			}
		}
	}
	if newestPath != "" {
		last = newest.UTC().Format(time.RFC3339)
	}
	return last, count
}

// collectOps gathers all best-effort ops info for one instance.
func collectOps(p Project) OpsInfo {
	disk, diskOK := instanceDisk(p)
	lastBackup, backupCount := backupStatus(p)
	return OpsInfo{
		Version:       pocketBaseVersion(),
		UptimeSeconds: instanceUptime(p),
		DiskBytes:     disk,
		DiskAvailable: diskOK,
		LastBackup:    lastBackup,
		BackupCount:   backupCount,
	}
}
