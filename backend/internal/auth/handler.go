package auth

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"github.com/base-go/backend/pkg/middleware"
	"github.com/base-go/backend/pkg/response"
)

type Handler struct {
	service Service
}

func NewHandler(service Service) Handler {
	return Handler{
		service: service,
	}
}

// Register godoc
// @Summary Register a new user
// @Description Register a new user with email and password
// @Tags Auth
// @Accept json
// @Produce json
// @Param request body RegisterRequest true "Register request"
// @Success 201 {object} AuthResponse
// @Failure 400 {object} map[string]string "Invalid request body"
// @Failure 409 {object} map[string]string "User already exists"
// @Router /auth/register [post]
func (h Handler) Register(w http.ResponseWriter, r *http.Request) {
	var req RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.ResponseError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	authResp, statusCode, err := h.service.Register(r.Context(), req)
	if err != nil {
		response.ResponseError(w, statusCode, err.Error())
		return
	}

	response.ResponseJSON(w, statusCode, authResp)
}

// Login godoc
// @Summary Login user
// @Description Login with email and password to get JWT token
// @Tags Auth
// @Accept json
// @Produce json
// @Param request body LoginRequest true "Login request"
// @Success 200 {object} AuthResponse
// @Failure 400 {object} map[string]string "Invalid request body"
// @Failure 401 {object} map[string]string "Unauthorized"
// @Router /auth/login [post]
func (h Handler) Login(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.ResponseError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	authResp, statusCode, err := h.service.Login(r.Context(), req)
	if err != nil {
		response.ResponseError(w, statusCode, err.Error())
		return
	}

	response.ResponseJSON(w, statusCode, authResp)
}

// LoginWithGoogle godoc
// @Summary Login with Google
// @Description Login using Google OAuth ID Token
// @Tags Auth
// @Accept json
// @Produce json
// @Param request body GoogleOAuthRequest true "Google OAuth request"
// @Success 200 {object} AuthResponse
// @Failure 400 {object} map[string]string "Invalid request body"
// @Failure 401 {object} map[string]string "Invalid Google token"
// @Router /auth/oauth/google [post]
func (h Handler) LoginWithGoogle(w http.ResponseWriter, r *http.Request) {
	var req GoogleOAuthRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.ResponseError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	authResp, statusCode, err := h.service.LoginWithGoogle(r.Context(), req)
	if err != nil {
		response.ResponseError(w, statusCode, err.Error())
		return
	}

	response.ResponseJSON(w, statusCode, authResp)
}

// RefreshToken godoc
// @Summary Refresh access token
// @Description Get a new access token using a refresh token
// @Tags Auth
// @Accept json
// @Produce json
// @Param request body RefreshTokenRequest true "Refresh token request"
// @Success 200 {object} AuthResponse
// @Failure 400 {object} map[string]string "Invalid request body"
// @Failure 401 {object} map[string]string "Invalid refresh token"
// @Router /auth/refresh [post]
func (h Handler) RefreshToken(w http.ResponseWriter, r *http.Request) {
	var req RefreshTokenRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.ResponseError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	authResp, statusCode, err := h.service.RefreshToken(r.Context(), req)
	if err != nil {
		response.ResponseError(w, statusCode, err.Error())
		return
	}

	response.ResponseJSON(w, statusCode, authResp)
}

// Logout godoc
// @Summary Logout user
// @Description Logout the current user and invalidate tokens
// @Tags Auth
// @Security BearerAuth
// @Accept json
// @Produce json
// @Success 200 {object} map[string]string "Logged out successfully"
// @Failure 401 {object} map[string]string "Unauthorized"
// @Router /auth/logout [post]
func (h Handler) Logout(w http.ResponseWriter, r *http.Request) {
	// Get user context
	userCtx, ok := r.Context().Value(middleware.ContextUser).(response.UserContext)
	if !ok {
		response.ResponseError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	userID, err := uuid.Parse(userCtx.UserID)
	if err != nil {
		response.ResponseError(w, http.StatusBadRequest, "Invalid user ID")
		return
	}

	statusCode, err := h.service.Logout(r.Context(), userID)
	if err != nil {
		response.ResponseError(w, statusCode, err.Error())
		return
	}

	response.ResponseJSON(w, statusCode, map[string]string{"message": "Logged out successfully"})
}

// GetProfile godoc
// @Summary Get user profile
// @Description Get the profile of the currently logged-in user
// @Tags Auth
// @Security BearerAuth
// @Accept json
// @Produce json
// @Success 200 {object} UserResponse
// @Failure 401 {object} map[string]string "Unauthorized"
// @Router /auth/profile [get]
func (h Handler) GetProfile(w http.ResponseWriter, r *http.Request) {
	// Get user context
	userCtx, ok := r.Context().Value(middleware.ContextUser).(response.UserContext)
	if !ok {
		response.ResponseError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	userID, err := uuid.Parse(userCtx.UserID)
	if err != nil {
		response.ResponseError(w, http.StatusBadRequest, "Invalid user ID")
		return
	}

	profile, statusCode, err := h.service.GetProfile(r.Context(), userID)
	if err != nil {
		response.ResponseError(w, statusCode, err.Error())
		return
	}

	response.ResponseJSON(w, statusCode, profile)
}

// UpdateProfile godoc
// @Summary Update user profile
// @Description Update the profile information for the current user
// @Tags Auth
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param request body UpdateProfileRequest true "Update profile request"
// @Success 200 {object} UserResponse
// @Failure 400 {object} map[string]string "Invalid request body"
// @Failure 401 {object} map[string]string "Unauthorized"
// @Router /auth/profile [put]
func (h Handler) UpdateProfile(w http.ResponseWriter, r *http.Request) {
	// Get user context
	userCtx, ok := r.Context().Value(middleware.ContextUser).(response.UserContext)
	if !ok {
		response.ResponseError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	userID, err := uuid.Parse(userCtx.UserID)
	if err != nil {
		response.ResponseError(w, http.StatusBadRequest, "Invalid user ID")
		return
	}

	var req UpdateProfileRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.ResponseError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	user, statusCode, err := h.service.UpdateProfile(r.Context(), userID, req)
	if err != nil {
		response.ResponseError(w, statusCode, err.Error())
		return
	}

	response.ResponseJSON(w, statusCode, user)
}

// ChangePassword godoc
// @Summary Change user password
// @Description Change the password for the currently logged-in user
// @Tags Auth
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param request body ChangePasswordRequest true "Change password request"
// @Success 200 {object} map[string]string "Password changed successfully"
// @Failure 400 {object} map[string]string "Invalid request body"
// @Router /auth/change-password [post]
func (h Handler) ChangePassword(w http.ResponseWriter, r *http.Request) {
	// Get user context
	userCtx, ok := r.Context().Value(middleware.ContextUser).(response.UserContext)
	if !ok {
		response.ResponseError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	userID, err := uuid.Parse(userCtx.UserID)
	if err != nil {
		response.ResponseError(w, http.StatusBadRequest, "Invalid user ID")
		return
	}

	var req ChangePasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.ResponseError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	statusCode, err := h.service.ChangePassword(r.Context(), userID, req)
	if err != nil {
		response.ResponseError(w, statusCode, err.Error())
		return
	}

	response.ResponseJSON(w, statusCode, map[string]string{"message": "Password changed successfully"})
}

// --- User Management (Admin) ---

// ListUsers godoc
// @Summary List users
// @Description Get a paginated list of users (Admin only)
// @Tags User Management
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param page query int false "Page number" default(1)
// @Param page_size query int false "Page size" default(10)
// @Param search query string false "Search term"
// @Param sort_by query string false "Sort field"
// @Param sort_dir query string false "Sort direction"
// @Param is_active query bool false "Filter by active status"
// @Param role_id query int false "Filter by role ID"
// @Success 200 {object} UserListResponse
// @Failure 401 {object} map[string]string "Unauthorized"
// @Failure 403 {object} map[string]string "Forbidden"
// @Router /users [get]
func (h Handler) ListUsers(w http.ResponseWriter, r *http.Request) {
	var req UserListRequest

	// Parse query parameters
	req.Page = parseIntParam(r.URL.Query().Get("page"), 1)
	req.PageSize = parseIntParam(r.URL.Query().Get("page_size"), 10)
	req.Search = r.URL.Query().Get("search")
	req.SortBy = r.URL.Query().Get("sort_by")
	req.SortDir = r.URL.Query().Get("sort_dir")

	if isActive := r.URL.Query().Get("is_active"); isActive != "" {
		val := isActive == "true"
		req.IsActive = &val
	}

	if roleID := r.URL.Query().Get("role_id"); roleID != "" {
		val := parseIntParam(roleID, 0)
		if val > 0 {
			req.RoleID = &val
		}
	}

	result, statusCode, err := h.service.ListUsers(r.Context(), req)
	if err != nil {
		response.ResponseError(w, statusCode, err.Error())
		return
	}

	response.ResponseJSON(w, statusCode, result)
}

// CreateUser godoc
// @Summary Create user
// @Description Create a new user by an admin
// @Tags User Management
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param request body CreateUserRequest true "Create user request"
// @Success 201 {object} UserResponse
// @Failure 400 {object} map[string]string "Invalid request body"
// @Router /users [post]
func (h Handler) CreateUser(w http.ResponseWriter, r *http.Request) {
	var req CreateUserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.ResponseError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	user, statusCode, err := h.service.CreateUserByAdmin(r.Context(), req)
	if err != nil {
		response.ResponseError(w, statusCode, err.Error())
		return
	}

	response.ResponseJSON(w, statusCode, user)
}

// GetUserByID godoc
// @Summary Get user by ID
// @Description Get detailed information for a specific user
// @Tags User Management
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param id path string true "User UUID"
// @Success 200 {object} UserResponse
// @Failure 404 {object} map[string]string "User not found"
// @Router /users/{id} [get]
func (h Handler) GetUserByID(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		response.ResponseError(w, http.StatusBadRequest, "Invalid user ID")
		return
	}

	user, statusCode, err := h.service.GetUserByID(r.Context(), id)
	if err != nil {
		response.ResponseError(w, statusCode, err.Error())
		return
	}

	response.ResponseJSON(w, statusCode, user)
}

// UpdateUser godoc
// @Summary Update user
// @Description Update user information by an admin
// @Tags User Management
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param id path string true "User UUID"
// @Param request body AdminUpdateUserRequest true "Update user request"
// @Success 200 {object} UserResponse
// @Failure 400 {object} map[string]string "Invalid request body"
// @Router /users/{id} [put]
func (h Handler) UpdateUser(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		response.ResponseError(w, http.StatusBadRequest, "Invalid user ID")
		return
	}

	var req AdminUpdateUserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.ResponseError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	user, statusCode, err := h.service.UpdateUserByAdmin(r.Context(), id, req)
	if err != nil {
		response.ResponseError(w, statusCode, err.Error())
		return
	}

	response.ResponseJSON(w, statusCode, user)
}

// DeleteUser godoc
// @Summary Delete user
// @Description Soft delete a user
// @Tags User Management
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param id path string true "User UUID"
// @Success 200 {object} map[string]string "User deleted successfully"
// @Router /users/{id} [delete]
func (h Handler) DeleteUser(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		response.ResponseError(w, http.StatusBadRequest, "Invalid user ID")
		return
	}

	statusCode, err := h.service.DeleteUserByAdmin(r.Context(), id)
	if err != nil {
		response.ResponseError(w, statusCode, err.Error())
		return
	}

	response.ResponseJSON(w, statusCode, map[string]string{"message": "User deleted successfully"})
}

// ToggleUserStatus godoc
// @Summary Toggle user status
// @Description Toggle user active/inactive status
// @Tags User Management
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param id path string true "User UUID"
// @Success 200 {object} UserResponse
// @Router /users/{id}/toggle-status [post]
func (h Handler) ToggleUserStatus(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		response.ResponseError(w, http.StatusBadRequest, "Invalid user ID")
		return
	}

	user, statusCode, err := h.service.ToggleUserStatus(r.Context(), id)
	if err != nil {
		response.ResponseError(w, statusCode, err.Error())
		return
	}

	response.ResponseJSON(w, statusCode, user)
}

// Helper function
func parseIntParam(s string, defaultVal int) int {
	if s == "" {
		return defaultVal
	}
	val := 0
	for _, c := range s {
		if c >= '0' && c <= '9' {
			val = val*10 + int(c-'0')
		} else {
			return defaultVal
		}
	}
	return val
}

// --- Deleted Users (Restore) ---

// ListDeletedUsers godoc
// @Summary List deleted users
// @Description Get a paginated list of soft-deleted users
// @Tags User Management
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param page query int false "Page number" default(1)
// @Param page_size query int false "Page size" default(10)
// @Param search query string false "Search term"
// @Success 200 {object} UserListResponse
// @Router /users/deleted [get]
func (h Handler) ListDeletedUsers(w http.ResponseWriter, r *http.Request) {
	var req UserListRequest

	// Parse query parameters
	req.Page = parseIntParam(r.URL.Query().Get("page"), 1)
	req.PageSize = parseIntParam(r.URL.Query().Get("page_size"), 10)
	req.Search = r.URL.Query().Get("search")
	req.SortBy = r.URL.Query().Get("sort_by")
	req.SortDir = r.URL.Query().Get("sort_dir")

	result, statusCode, err := h.service.ListDeletedUsers(r.Context(), req)
	if err != nil {
		response.ResponseError(w, statusCode, err.Error())
		return
	}

	response.ResponseJSON(w, statusCode, result)
}

// RestoreUser godoc
// @Summary Restore deleted user
// @Description Restore a soft-deleted user
// @Tags User Management
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param id path string true "User UUID"
// @Success 200 {object} UserResponse
// @Router /users/{id}/restore [post]
func (h Handler) RestoreUser(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		response.ResponseError(w, http.StatusBadRequest, "Invalid user ID")
		return
	}

	user, statusCode, err := h.service.RestoreUserByAdmin(r.Context(), id)
	if err != nil {
		response.ResponseError(w, statusCode, err.Error())
		return
	}

	response.ResponseJSON(w, statusCode, user)
}
