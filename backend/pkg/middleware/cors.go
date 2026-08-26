package middleware

import (
	"net/http"
	"os"
	"strings"

	"github.com/go-chi/cors"
)

// CORS pakai allowlist eksplisit — jangan wildcard "*" bersama credentials.
// Set CORS_ALLOWED_ORIGINS di env, dipisah koma (mis. produksi:
// "https://undangan.example.com,https://admin.example.com").
func Cors() func(next http.Handler) http.Handler {
	allowedOrigins := strings.Split(strings.TrimSpace(os.Getenv("CORS_ALLOWED_ORIGINS")), ",")
	if len(allowedOrigins) == 0 || allowedOrigins[0] == "" {
		allowedOrigins = []string{"http://localhost:3000", "http://localhost:3001"}
	}

	return cors.Handler(cors.Options{
		AllowedOrigins:   allowedOrigins,
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		AllowCredentials: true,
		MaxAge:           300, // 5 minute
	})
}
