package middleware

import (
	"net"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

	"golang.org/x/time/rate"

	"github.com/base-go/backend/pkg/response"
)

type client struct {
	limiter  *rate.Limiter
	lastSeen time.Time
}

// trustProxy: X-Forwarded-For hanya dipercaya kalau service berjalan di
// balik reverse proxy terpercaya (set TRUST_PROXY=true). Tanpa itu, header
// XFF dikontrol penyerang — dipakai untuk merotasi identitas & mem-bypass limit.
var trustProxy = os.Getenv("TRUST_PROXY") == "true"

// RateLimit is middleware for handling rate limiter request per ip address
//
// first params is requestPerSecond
//
// second params is for burst,
//
// This burst is like a basket containing N tokens (N being the burst value). Each HTTP request retrieves a token from this basket. If the basket runs out of tokens, the rate limit occurs.
//
// The first parameter, RequestPerSecond, refills the basket with the specified number of tokens every second. If the basket reaches N, the token refill will stop.
func RateLimit(requestsPerSecond int, burst int) func(handler http.Handler) http.Handler {

	var mu sync.Mutex
	clients := make(map[string]*client)

	// set go routing to delete clients that have been inactive for a few minutes
	go func() {
		for {
			time.Sleep(time.Minute)
			mu.Lock()

			for ip, c := range clients {
				// delete client if lastSeen > 2 minute
				if time.Since(c.lastSeen) > 2*time.Minute {
					delete(clients, ip)
				}
			}

			mu.Unlock()
		}
	}()

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// get client ip address (tanpa port — kalau tidak, tiap koneksi
			// dihitung klien berbeda dan limit tak pernah jalan)
			ip := r.RemoteAddr
			if trustProxy {
				if forwarded := r.Header.Get("X-Forwarded-For"); forwarded != "" {
					ip = strings.TrimSpace(strings.Split(forwarded, ",")[0])
				} else if host, _, err := net.SplitHostPort(ip); err == nil {
					ip = host
				}
			} else if host, _, err := net.SplitHostPort(ip); err == nil {
				ip = host
			}

			mu.Lock()
			if _, found := clients[ip]; !found {
				// create new ratelimiter client if not exist
				clients[ip] = &client{
					limiter: rate.NewLimiter(rate.Limit(requestsPerSecond), burst),
				}
			}
			// update lastSeen
			clients[ip].lastSeen = time.Now()

			// check if allow
			if !clients[ip].limiter.Allow() {
				// need to unlock if request not allowed
				mu.Unlock()
				response.ResponseError(w, http.StatusTooManyRequests, "Terlalu banyak permintaan. Coba lagi sebentar lagi.")
				return
			}

			// need to unlock if request allow
			mu.Unlock()

			next.ServeHTTP(w, r)
		})
	}
}
