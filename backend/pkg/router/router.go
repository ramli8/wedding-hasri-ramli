package router

import (
	"compress/zlib"
	"net/http"

	"github.com/base-go/backend/internal/auth"
	"github.com/base-go/backend/internal/guest"
	"github.com/base-go/backend/internal/rbac"
	"github.com/base-go/backend/pkg/middleware"
	"github.com/base-go/backend/pkg/response"
	"github.com/go-chi/chi/v5"
	cmiddleware "github.com/go-chi/chi/v5/middleware"
	"github.com/unrolled/secure"

	_ "github.com/base-go/backend/docs"
	"github.com/base-go/backend/pkg/config"
	httpSwagger "github.com/swaggo/http-swagger"
)

// SetupRoutes this function for centralize setup all route in this app.
// why wee need to centralize?, it's for easies debugging if any issue
//
// parameters: all interface handlers we need to expose with rest
func SetupRoutes(
	authHandler auth.Handler,
	rbacHandler rbac.Handler,
	rbacRepo rbac.Repository,
	guestHandler guest.Handler,
) *chi.Mux {
	mux := chi.NewRouter()

	// chi middleware
	mux.Use(cmiddleware.Logger)
	mux.Use(cmiddleware.Recoverer)
	mux.Use(cmiddleware.RealIP)
	mux.Use(cmiddleware.NoCache)
	mux.Use(cmiddleware.GetHead)
	mux.Use(cmiddleware.Compress(zlib.BestCompression))
	mux.Use(secure.New(secure.Options{
		FrameDeny:            true,
		ContentTypeNosniff:   true,
		BrowserXssFilter:     true,
		STSIncludeSubdomains: true,
		STSPreload:           true,
		STSSeconds:           900,
	}).Handler)

	mux.MethodNotAllowed(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		res := response.JSON{Code: http.StatusMethodNotAllowed, Message: "Route method not allowed"}
		response.ResponseJSON(w, res.Code, res)
	}))

	mux.NotFound(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		res := response.JSON{Code: http.StatusNotFound, Message: "Route not found"}
		response.ResponseJSON(w, res.Code, res)
	}))

	// set cors middleware
	mux.Use(middleware.Cors())
	// set middleware rate limiter
	mux.Use(middleware.RateLimit(1000, 10))

	// set prefix v1
	mux.Route("/v1", func(r chi.Router) {
		r.Use(cmiddleware.AllowContentType("application/json", "multipart/form-data"))


		// Authentication routes (public)
		r.Route("/auth", func(r chi.Router) {
			r.Post("/register", authHandler.Register)
			r.Post("/login", authHandler.Login)
			r.Post("/oauth/google", authHandler.LoginWithGoogle)
			r.Post("/refresh", authHandler.RefreshToken)

			// Protected auth routes
			r.Group(func(r chi.Router) {
				r.Use(middleware.JWTAuthMiddleware)
				r.Post("/logout", authHandler.Logout)
				r.Get("/profile", authHandler.GetProfile)
				r.Put("/profile", authHandler.UpdateProfile)
				r.Post("/change-password", authHandler.ChangePassword)
			})
		})

		// RBAC routes (protected, admin only)
		r.Route("/rbac", func(r chi.Router) {
			r.Use(middleware.JWTAuthMiddleware)
			r.Use(middleware.RequireRole("Super Admin", "Admin"))

			// Roles
			r.Route("/roles", func(r chi.Router) {
				r.With(middleware.RequirePermission(rbacRepo, "roles.create")).Post("/", rbacHandler.CreateRole)
				r.Get("/", rbacHandler.GetAllRoles)

				r.Route("/{id}", func(r chi.Router) {
					r.Get("/", rbacHandler.GetRoleByID)
					r.With(middleware.RequirePermission(rbacRepo, "roles.update")).Put("/", rbacHandler.UpdateRole)
					r.With(middleware.RequirePermission(rbacRepo, "roles.delete")).Delete("/", rbacHandler.DeleteRole)

					// Role permissions
					r.With(middleware.RequirePermission(rbacRepo, "permissions.assign")).Post("/permissions", rbacHandler.AssignPermissionsToRole)
					r.Get("/permissions", rbacHandler.GetRolePermissions)

					// Module access
					r.With(middleware.RequirePermission(rbacRepo, "permissions.assign")).Post("/module-access", rbacHandler.UpdateModuleAccess)
					r.Get("/module-access", rbacHandler.GetModuleAccessByRole)
				})
			})

			// Permissions
			r.Route("/permissions", func(r chi.Router) {
				r.With(middleware.RequirePermission(rbacRepo, "permissions.create")).Post("/", rbacHandler.CreatePermission)
				r.Get("/", rbacHandler.GetAllPermissions)
				r.Get("/by-module", rbacHandler.GetPermissionsByModule)

				r.Route("/{id}", func(r chi.Router) {
					r.Get("/", rbacHandler.GetPermissionByID)
					r.With(middleware.RequirePermission(rbacRepo, "permissions.update")).Put("/", rbacHandler.UpdatePermission)
					r.With(middleware.RequirePermission(rbacRepo, "permissions.delete")).Delete("/", rbacHandler.DeletePermission)
				})
			})

			// User roles
			r.Route("/users/{userId}/roles", func(r chi.Router) {
				r.With(middleware.RequirePermission(rbacRepo, "roles.assign")).Post("/", rbacHandler.AssignRolesToUser)
				r.Get("/", rbacHandler.GetUserRoles)
			})

			// Permission checking (available to all authenticated users)
			r.Group(func(r chi.Router) {
				r.Post("/check-permission", rbacHandler.CheckPermission)
				r.Post("/check-module-access", rbacHandler.CheckModuleAccess)
			})
		})

		// User management routes (protected - Admin only)
		r.Route("/users", func(r chi.Router) {
			r.Use(middleware.JWTAuthMiddleware)
			r.Use(middleware.RequireRole("Super Admin", "Admin"))

			r.Get("/", authHandler.ListUsers)
			r.With(middleware.RequirePermission(rbacRepo, "users.create")).Post("/", authHandler.CreateUser)
			r.Get("/deleted", authHandler.ListDeletedUsers)

			r.Route("/{id}", func(r chi.Router) {
				r.Get("/", authHandler.GetUserByID)
				r.With(middleware.RequirePermission(rbacRepo, "users.update")).Put("/", authHandler.UpdateUser)
				r.With(middleware.RequirePermission(rbacRepo, "users.delete")).Delete("/", authHandler.DeleteUser)
				r.With(middleware.RequirePermission(rbacRepo, "users.manage_status")).Post("/toggle-status", authHandler.ToggleUserStatus)
				r.With(middleware.RequirePermission(rbacRepo, "users.manage_status")).Post("/restore", authHandler.RestoreUser)
			})
		})

		// Guest management routes (protected - Admin only)
		r.Route("/guests", func(r chi.Router) {
			r.Use(middleware.JWTAuthMiddleware)
			r.Use(middleware.RequireRole("Super Admin", "Admin"))

			r.With(middleware.RequirePermission(rbacRepo, "guests.create")).Post("/", guestHandler.CreateGuest)
			r.Get("/", guestHandler.ListGuests)
			r.Get("/deleted", guestHandler.ListDeletedGuests)
			r.Get("/export", guestHandler.ExportGuests)
			r.Get("/template", guestHandler.GetImportTemplate)
			r.Post("/import/preview", guestHandler.PreviewImport)
			r.Post("/import/execute", guestHandler.ExecuteImport)

			r.Route("/categories", func(r chi.Router) {
				r.With(middleware.RequirePermission(rbacRepo, "guest_categories.create")).Post("/", guestHandler.CreateCategory)
				r.Get("/", guestHandler.ListCategories)
				r.Route("/{id}", func(r chi.Router) {
					r.Get("/", guestHandler.GetCategoryByID)
					r.With(middleware.RequirePermission(rbacRepo, "guest_categories.update")).Put("/", guestHandler.UpdateCategory)
					r.With(middleware.RequirePermission(rbacRepo, "guest_categories.delete")).Delete("/", guestHandler.DeleteCategory)
				})
			})

			r.Route("/{id}", func(r chi.Router) {
				r.Get("/", guestHandler.GetGuestByID)
				r.With(middleware.RequirePermission(rbacRepo, "guests.update")).Put("/", guestHandler.UpdateGuest)
				r.With(middleware.RequirePermission(rbacRepo, "guests.delete")).Delete("/", guestHandler.DeleteGuest)
				r.With(middleware.RequirePermission(rbacRepo, "guests.update")).Post("/restore", guestHandler.RestoreGuest)
				r.With(middleware.RequirePermission(rbacRepo, "guests.update")).Put("/status-sent", guestHandler.UpdateStatusSent)
			})
		})
	})

	// Swagger documentation (only in development/staging)
	cfg := config.GetConfig()
	if cfg.App.Env == "development" || cfg.App.Env == "staging" {
		mux.Get("/swagger/*", httpSwagger.Handler(
			httpSwagger.URL("/swagger/doc.json"), // The url pointing to API definition
		))
	}

	return mux
}
