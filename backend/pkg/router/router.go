package router

import (
	"compress/zlib"
	"net/http"

	"github.com/base-go/backend/internal/auth"
	"github.com/base-go/backend/internal/guest"
	"github.com/base-go/backend/internal/invitation"
	"github.com/base-go/backend/internal/kondangan"
	"github.com/base-go/backend/internal/rbac"
	"github.com/base-go/backend/internal/vendor"
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
	vendorHandler vendor.Handler,
	kondanganHandler kondangan.Handler,
	invitationHandler invitation.Handler,
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

		// Vendor management routes (protected - Admin only)
		r.Route("/vendors", func(r chi.Router) {
			r.Use(middleware.JWTAuthMiddleware)
			r.Use(middleware.RequireRole("Super Admin", "Admin"))

			r.Get("/overview", vendorHandler.GetOverview)

			r.Route("/categories", func(r chi.Router) {
				r.With(middleware.RequirePermission(rbacRepo, "vendors.categories.create")).Post("/", vendorHandler.CreateCategory)
				r.Get("/", vendorHandler.ListCategories)

				r.Route("/{id}", func(r chi.Router) {
					r.Get("/", vendorHandler.GetCategoryByID)
					r.With(middleware.RequirePermission(rbacRepo, "vendors.categories.update")).Put("/", vendorHandler.UpdateCategory)
					r.With(middleware.RequirePermission(rbacRepo, "vendors.categories.delete")).Delete("/", vendorHandler.DeleteCategory)

					r.Post("/select/{vendorId}", vendorHandler.SelectVendor)
					r.Delete("/select", vendorHandler.DeselectVendor)

					r.Route("/attributes", func(r chi.Router) {
						r.With(middleware.RequirePermission(rbacRepo, "vendors.attributes.create")).Post("/", vendorHandler.CreateAttribute)
						r.Get("/", vendorHandler.ListAttributes)
					})

					r.Route("/vendors", func(r chi.Router) {
						r.With(middleware.RequirePermission(rbacRepo, "vendors.create")).Post("/", vendorHandler.CreateVendor)
						r.Get("/", vendorHandler.ListVendors)
					})
				})
			})

			r.Route("/attributes/{id}", func(r chi.Router) {
				r.With(middleware.RequirePermission(rbacRepo, "vendors.attributes.update")).Put("/", vendorHandler.UpdateAttribute)
				r.With(middleware.RequirePermission(rbacRepo, "vendors.attributes.delete")).Delete("/", vendorHandler.DeleteAttribute)
			})

			r.Route("/{id}", func(r chi.Router) {
				r.Get("/", vendorHandler.GetVendorByID)
				r.With(middleware.RequirePermission(rbacRepo, "vendors.update")).Put("/", vendorHandler.UpdateVendor)
				r.With(middleware.RequirePermission(rbacRepo, "vendors.delete")).Delete("/", vendorHandler.DeleteVendor)
				r.With(middleware.RequirePermission(rbacRepo, "vendors.update")).Put("/attribute-values", vendorHandler.UpdateAttributeValues)

				r.Route("/payments", func(r chi.Router) {
					r.With(middleware.RequirePermission(rbacRepo, "vendors.payments.create")).Post("/", vendorHandler.CreatePayment)
					r.Get("/", vendorHandler.ListPayments)
				})
			})

			r.Route("/payments/{id}", func(r chi.Router) {
				r.With(middleware.RequirePermission(rbacRepo, "vendors.payments.update")).Put("/", vendorHandler.UpdatePayment)
				r.With(middleware.RequirePermission(rbacRepo, "vendors.payments.delete")).Delete("/", vendorHandler.DeletePayment)
			})
		})

		// Guest management routes (protected - Admin only)
		r.Route("/guests", func(r chi.Router) {
			r.Use(middleware.JWTAuthMiddleware)
			r.Use(middleware.RequireRole("Super Admin", "Admin"))

			r.With(middleware.RequirePermission(rbacRepo, "guests.create")).Post("/", guestHandler.CreateGuest)
			r.Get("/", guestHandler.ListGuests)
			r.Post("/check-in", guestHandler.CheckInByQRCode)
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
				r.Post("/check-in", guestHandler.CheckInByGuestID)
			})
		})

		// Kondangan routes (protected - Admin only)
		r.Route("/kondangan", func(r chi.Router) {
			r.Use(middleware.JWTAuthMiddleware)
			r.Use(middleware.RequireRole("Super Admin", "Admin"))

			r.Post("/", kondanganHandler.Create)
			r.Get("/", kondanganHandler.List)
			r.Get("/stats", kondanganHandler.GetStats)

			r.Route("/relations", func(r chi.Router) {
				r.Post("/", kondanganHandler.CreateRelation)
				r.Get("/", kondanganHandler.ListRelations)
				r.Delete("/{id}", kondanganHandler.DeleteRelation)
			})

			r.Route("/{id}", func(r chi.Router) {
				r.Get("/", kondanganHandler.GetByID)
				r.Put("/", kondanganHandler.Update)
				r.Delete("/", kondanganHandler.Delete)
			})
		})

		// Invitation public routes (no JWT - accessed by wedding guests)
		r.Route("/invitation", func(r chi.Router) {
			r.Get("/", invitationHandler.GetPublicInvitation)
			r.Get("/guestbook", invitationHandler.ListGuestbook)
			r.Get("/wishlist", invitationHandler.ListPublicWishlist)
			// Tulis publik dibatasi per IP (anti-spam).
			writeLimit := middleware.RateLimit(1, 3)
			r.With(writeLimit).Post("/rsvp", invitationHandler.SubmitRSVP)
			r.With(writeLimit).Post("/guestbook", invitationHandler.SubmitGuestbook)
			r.With(writeLimit).Post("/wishlist/{itemID}/claim", invitationHandler.ClaimPublicWishlist)
			r.With(writeLimit).Delete("/wishlist/{itemID}/claim", invitationHandler.UnclaimPublicWishlist)
		})

		// Wedding/invitation management routes (protected - Admin only)
		r.Route("/wedding", func(r chi.Router) {
			r.Use(middleware.JWTAuthMiddleware)
			r.Use(middleware.RequireRole("Super Admin", "Admin"))

			r.Get("/", invitationHandler.GetWedding)
			r.With(middleware.RequirePermission(rbacRepo, "weddings.update")).Put("/", invitationHandler.UpdateWedding)

			// Couples
			r.Route("/couples", func(r chi.Router) {
				r.With(middleware.RequirePermission(rbacRepo, "weddings.create")).Post("/", invitationHandler.CreateCouple)
				r.Get("/", invitationHandler.ListCouples)
				r.Route("/{id}", func(r chi.Router) {
					r.Get("/", invitationHandler.GetCouple)
					r.With(middleware.RequirePermission(rbacRepo, "weddings.update")).Put("/", invitationHandler.UpdateCouple)
					r.With(middleware.RequirePermission(rbacRepo, "weddings.delete")).Delete("/", invitationHandler.DeleteCouple)
				})
			})

			// Events
			r.Route("/events", func(r chi.Router) {
				r.With(middleware.RequirePermission(rbacRepo, "weddings.create")).Post("/", invitationHandler.CreateEvent)
				r.Get("/", invitationHandler.ListEvents)
				r.Route("/{id}", func(r chi.Router) {
					r.Get("/", invitationHandler.GetEvent)
					r.With(middleware.RequirePermission(rbacRepo, "weddings.update")).Put("/", invitationHandler.UpdateEvent)
					r.With(middleware.RequirePermission(rbacRepo, "weddings.delete")).Delete("/", invitationHandler.DeleteEvent)
				})
			})

			// Story timeline
			r.Route("/story", func(r chi.Router) {
				r.With(middleware.RequirePermission(rbacRepo, "weddings.create")).Post("/", invitationHandler.CreateStory)
				r.Get("/", invitationHandler.ListStories)
				r.Route("/{id}", func(r chi.Router) {
					r.Get("/", invitationHandler.GetStory)
					r.With(middleware.RequirePermission(rbacRepo, "weddings.update")).Put("/", invitationHandler.UpdateStory)
					r.With(middleware.RequirePermission(rbacRepo, "weddings.delete")).Delete("/", invitationHandler.DeleteStory)
				})
			})

			// Gallery
			r.Route("/gallery", func(r chi.Router) {
				r.With(middleware.RequirePermission(rbacRepo, "weddings.create")).Post("/", invitationHandler.CreateGalleryItem)
				r.Get("/", invitationHandler.ListGalleryItems)
				r.Route("/{id}", func(r chi.Router) {
					r.Get("/", invitationHandler.GetGalleryItem)
					r.With(middleware.RequirePermission(rbacRepo, "weddings.update")).Put("/", invitationHandler.UpdateGalleryItem)
					r.With(middleware.RequirePermission(rbacRepo, "weddings.delete")).Delete("/", invitationHandler.DeleteGalleryItem)
				})
			})

			// FAQs
			r.Route("/faqs", func(r chi.Router) {
				r.With(middleware.RequirePermission(rbacRepo, "weddings.create")).Post("/", invitationHandler.CreateFaq)
				r.Get("/", invitationHandler.ListFaqs)
				r.Route("/{id}", func(r chi.Router) {
					r.Get("/", invitationHandler.GetFaq)
					r.With(middleware.RequirePermission(rbacRepo, "weddings.update")).Put("/", invitationHandler.UpdateFaq)
					r.With(middleware.RequirePermission(rbacRepo, "weddings.delete")).Delete("/", invitationHandler.DeleteFaq)
				})
			})

			// Bank accounts (digital envelope)
			r.Route("/bank-accounts", func(r chi.Router) {
				r.With(middleware.RequirePermission(rbacRepo, "weddings.create")).Post("/", invitationHandler.CreateBankAccount)
				r.Get("/", invitationHandler.ListBankAccounts)
				r.Route("/{id}", func(r chi.Router) {
					r.Get("/", invitationHandler.GetBankAccount)
					r.With(middleware.RequirePermission(rbacRepo, "weddings.update")).Put("/", invitationHandler.UpdateBankAccount)
					r.With(middleware.RequirePermission(rbacRepo, "weddings.delete")).Delete("/", invitationHandler.DeleteBankAccount)
				})
			})

			// E-wallets (digital envelope)
			r.Route("/ewallets", func(r chi.Router) {
				r.With(middleware.RequirePermission(rbacRepo, "weddings.create")).Post("/", invitationHandler.CreateEwallet)
				r.Get("/", invitationHandler.ListEwallets)
				r.Route("/{id}", func(r chi.Router) {
					r.Get("/", invitationHandler.GetEwallet)
					r.With(middleware.RequirePermission(rbacRepo, "weddings.update")).Put("/", invitationHandler.UpdateEwallet)
					r.With(middleware.RequirePermission(rbacRepo, "weddings.delete")).Delete("/", invitationHandler.DeleteEwallet)
				})
			})

			// Wishlist gifts
			r.Route("/wishlist", func(r chi.Router) {
				r.With(middleware.RequirePermission(rbacRepo, "weddings.create")).Post("/", invitationHandler.CreateWishlistItem)
				r.Get("/", invitationHandler.ListWishlistItems)
				r.Route("/{id}", func(r chi.Router) {
					r.Get("/", invitationHandler.GetWishlistItem)
					r.With(middleware.RequirePermission(rbacRepo, "weddings.update")).Put("/", invitationHandler.UpdateWishlistItem)
					r.With(middleware.RequirePermission(rbacRepo, "weddings.delete")).Delete("/", invitationHandler.DeleteWishlistItem)
				})
			})

			// Sections visibility & ordering
			r.Route("/sections", func(r chi.Router) {
				r.With(middleware.RequirePermission(rbacRepo, "weddings.create")).Post("/", invitationHandler.CreateSection)
				r.Get("/", invitationHandler.ListSections)
				r.Route("/{id}", func(r chi.Router) {
					r.Get("/", invitationHandler.GetSection)
					r.With(middleware.RequirePermission(rbacRepo, "weddings.update")).Put("/", invitationHandler.UpdateSection)
					r.With(middleware.RequirePermission(rbacRepo, "weddings.delete")).Delete("/", invitationHandler.DeleteSection)
				})
			})

			// Ucapan: daftar, balasan & hapus
			r.Get("/guestbook", invitationHandler.ListAdminGuestbook)
			r.With(middleware.RequirePermission(rbacRepo, "weddings.update")).Put("/guestbook/{id}/reply", invitationHandler.ReplyGuestbook)
			r.With(middleware.RequirePermission(rbacRepo, "weddings.update")).Delete("/guestbook/{id}", invitationHandler.DeleteGuestbook)

			// Ringkasan konfirmasi kehadiran
			r.Get("/rsvp/summary", invitationHandler.GetRSVPSummary)
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
