package main

import (
	"bufio"
	"fmt"
	"os"
	"strings"
)

// Project is one PocketBase instance, as declared in projects.conf.
type Project struct {
	Name   string `json:"name"`
	Port   string `json:"port"`
	Domain string `json:"domain"`
}

// loadProjects parses /opt/pocketbase/projects.conf.
// Format per line:  <name>  <port>  <domain>   (blank lines + # comments ignored)
func loadProjects(path string) ([]Project, error) {
	f, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer f.Close()

	var projects []Project
	sc := bufio.NewScanner(f)
	for sc.Scan() {
		line := strings.TrimSpace(sc.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		fields := strings.Fields(line)
		if len(fields) < 3 {
			continue
		}
		projects = append(projects, Project{Name: fields[0], Port: fields[1], Domain: fields[2]})
	}
	if err := sc.Err(); err != nil {
		return nil, err
	}
	if len(projects) == 0 {
		return nil, fmt.Errorf("no projects found in %s", path)
	}
	return projects, nil
}

func findProject(projects []Project, name string) (Project, bool) {
	for _, p := range projects {
		if p.Name == name {
			return p, true
		}
	}
	return Project{}, false
}
