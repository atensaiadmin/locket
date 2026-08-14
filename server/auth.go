package main

import (
	"crypto/sha256"
	"crypto/subtle"
	"encoding/hex"
	"encoding/json"
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

// Access-key auth for Locket.
//
// Model (mirrors PocketBase's "create first admin on first visit"):
//   - If no access key is configured yet, the UI shows a "Set your access key"
//     screen (POST /api/auth/setup). Until then, /api/* (except auth + health)
//     is effectively locked: if we're bound to a non-local address with no key,
//     we refuse to start at all (closes the "first visit window").
//   - After a key is set (stored as a SHA-256 hash in the auth file), every
//     /api/* call must carry `Authorization: Bearer <key>`.
//   - `LOCKET_TOKEN` env var overrides the stored file (for automation/containers).

// effectiveKeyHash returns the current key hash: LOCKET_TOKEN env wins, else file.
func effectiveKeyHash() string {
	if v := strings.TrimSpace(os.Getenv("LOCKET_TOKEN")); v != "" {
		return hashKey(v)
	}
	return storedKeyHash()
}

// storedKeyHash reads the auth file (set via the first-run setup screen).
func storedKeyHash() string {
	b, err := os.ReadFile(*authFile)
	if err != nil {
		return ""
	}
	var s struct {
		KeyHash string `json:"key_hash"`
	}
	if json.Unmarshal(b, &s) != nil {
		return ""
	}
	return s.KeyHash
}

func hashKey(k string) string {
	h := sha256.Sum256([]byte(k))
	return hex.EncodeToString(h[:])
}

// keyIsSet reports whether any access key is configured.
func keyIsSet() bool {
	return effectiveKeyHash() != ""
}

// validKey checks a supplied plaintext key against the configured key hash.
func validKey(k string) bool {
	h := effectiveKeyHash()
	if h == "" {
		return false
	}
	return subtle.ConstantTimeCompare([]byte(hashKey(k)), []byte(h)) == 1
}

// authOK inspects the Authorization header (Bearer <key>).
func authOK(r *http.Request) bool {
	if !keyIsSet() {
		// No key configured yet → setup mode. The bind guard in main() prevents
		// this from ever being publicly reachable in that state.
		return true
	}
	auth := r.Header.Get("Authorization")
	if !strings.HasPrefix(auth, "Bearer ") {
		return false
	}
	return validKey(strings.TrimPrefix(auth, "Bearer "))
}

// requireAuth wraps a handler, requiring a valid Bearer key.
func requireAuth(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if !authOK(r) {
			writeJSON(w, http.StatusUnauthorized, map[string]any{"error": "unauthorized"})
			return
		}
		next(w, r)
	}
}

// addrBindsPublic reports whether the listen address binds all interfaces
// (e.g. ":8090") rather than loopback ("127.0.0.1:8090" / "localhost:8090").
func addrBindsPublic(addr string) bool {
	return strings.HasPrefix(addr, ":") // Go shorthand ":port" binds all interfaces
}

// ---- auth endpoints -------------------------------------------------------

// GET /api/auth/status → { setup_required, authenticated }
func handleAuthStatus(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]any{
		"setup_required": !keyIsSet(),
		"authenticated":  authOK(r),
	})
}

// POST /api/auth/setup { key } → set the access key (only when none set yet)
func handleAuthSetup(w http.ResponseWriter, r *http.Request) {
	if keyIsSet() {
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": "access key already set"})
		return
	}
	var body struct {
		Key string `json:"key"`
	}
	if json.NewDecoder(r.Body).Decode(&body) != nil || len(body.Key) < 8 {
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": "access key must be at least 8 characters"})
		return
	}

	dir := filepath.Dir(*authFile)
	if err := os.MkdirAll(dir, 0o700); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]any{"error": err.Error()})
		return
	}
	data, _ := json.Marshal(map[string]string{"key_hash": hashKey(body.Key)})
	if err := os.WriteFile(*authFile, data, 0o600); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]any{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"ok": true})
}

// POST /api/auth/login { key } → returns ok if the key matches
func handleAuthLogin(w http.ResponseWriter, r *http.Request) {
	if !keyIsSet() {
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": "no access key set yet"})
		return
	}
	var body struct {
		Key string `json:"key"`
	}
	if json.NewDecoder(r.Body).Decode(&body) != nil {
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": "invalid body"})
		return
	}
	if !validKey(body.Key) {
		writeJSON(w, http.StatusUnauthorized, map[string]any{"error": "invalid access key"})
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"ok": true})
}
