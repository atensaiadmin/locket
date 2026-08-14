package main

import (
	"sync"
	"time"
)

// healthPoint is one recorded health observation for an instance.
type healthPoint struct {
	Time    time.Time `json:"time"`
	Healthy bool      `json:"healthy"`
}

// historyStore keeps a rolling window of health observations per instance.
// It's appended to passively whenever instances are listed, so it builds up
// history without a background job. State is in-memory (lost on restart) —
// good enough for the "was it up recently?" sparkline feature.
type historyStore struct {
	mu   sync.Mutex
	cap  int
	data map[string][]healthPoint
}

const historyCap = 60 // keep last 60 observations per instance

var history = &historyStore{
	cap:  historyCap,
	data: make(map[string][]healthPoint),
}

// record appends an observation, trimming to the cap.
func (h *historyStore) record(name string, healthy bool) {
	h.mu.Lock()
	defer h.mu.Unlock()
	pts := h.data[name]
	pts = append(pts, healthPoint{Time: time.Now(), Healthy: healthy})
	if len(pts) > h.cap {
		pts = pts[len(pts)-h.cap:]
	}
	h.data[name] = pts
}

// series returns a copy of the observations for an instance.
func (h *historyStore) series(name string) []healthPoint {
	h.mu.Lock()
	defer h.mu.Unlock()
	out := make([]healthPoint, len(h.data[name]))
	copy(out, h.data[name])
	return out
}
