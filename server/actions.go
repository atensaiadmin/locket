package main

import (
	"fmt"
	"os/exec"
	"path/filepath"
)

// runAction executes one of the whitelisted ops for a known project.
// This is a SAFETY boundary: only known actions, only for projects that exist
// in projects.conf (validated by the caller).
func runAction(action, name string) (string, error) {
	scriptsDir := filepath.Join(*pbHome, "scripts")

	var cmd *exec.Cmd
	switch action {
	case "deploy":
		// deploy.sh <name>  → git pull + migrate up + restart (see vultrbase/deploy)
		cmd = exec.Command("bash", filepath.Join(scriptsDir, "deploy.sh"), name)
	case "restart":
		cmd = exec.Command("systemctl", "restart", "pocketbase-"+name)
	default:
		return "", fmt.Errorf("unknown action: %s", action)
	}

	out, err := cmd.CombinedOutput()
	return string(out), err
}
