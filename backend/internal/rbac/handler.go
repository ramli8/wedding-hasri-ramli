package rbac

import (
	"encoding/json"
	"net/http"
	"strconv"

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

// --- Role Handlers ---

// CreateRole godoc
// @Summary Create role
// @Description Create a new role
// @Tags RBAC - Roles
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param request body CreateRoleRequest true "Create role request"
// @Success 201 {object} RoleResponse
// @Router /rbac/roles [post]
func (h Handler) CreateRole(w http.ResponseWriter, r *http.Request) {
	var req CreateRoleRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.ResponseError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	role, statusCode, err := h.service.CreateRole(r.Context(), req)
	if err != nil {
		response.ResponseError(w, statusCode, err.Error())
		return
	}

	response.ResponseJSON(w, statusCode, role)
}

// GetAllRoles godoc
// @Summary Get all roles
// @Description Get a list of all existing roles
// @Tags RBAC - Roles
// @Security BearerAuth
// @Accept json
// @Produce json
// @Success 200 {array} RoleResponse
// @Router /rbac/roles [get]
func (h Handler) GetAllRoles(w http.ResponseWriter, r *http.Request) {
	roles, statusCode, err := h.service.GetAllRoles(r.Context())
	if err != nil {
		response.ResponseError(w, statusCode, err.Error())
		return
	}

	response.ResponseJSON(w, statusCode, roles)
}

// GetRoleByID godoc
// @Summary Get role by ID
// @Description Get detailed information about a role
// @Tags RBAC - Roles
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param id path int true "Role ID"
// @Success 200 {object} RoleResponse
// @Router /rbac/roles/{id} [get]
func (h Handler) GetRoleByID(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		response.ResponseError(w, http.StatusBadRequest, "Invalid role ID")
		return
	}

	role, statusCode, err := h.service.GetRoleByID(r.Context(), id)
	if err != nil {
		response.ResponseError(w, statusCode, err.Error())
		return
	}

	response.ResponseJSON(w, statusCode, role)
}

// UpdateRole godoc
// @Summary Update role
// @Description Update role information
// @Tags RBAC - Roles
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param id path int true "Role ID"
// @Param request body UpdateRoleRequest true "Update role request"
// @Success 200 {object} RoleResponse
// @Router /rbac/roles/{id} [put]
func (h Handler) UpdateRole(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		response.ResponseError(w, http.StatusBadRequest, "Invalid role ID")
		return
	}

	var req UpdateRoleRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.ResponseError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	role, statusCode, err := h.service.UpdateRole(r.Context(), id, req)
	if err != nil {
		response.ResponseError(w, statusCode, err.Error())
		return
	}

	response.ResponseJSON(w, statusCode, role)
}

// DeleteRole godoc
// @Summary Delete role
// @Description Permanently delete a role (non-system roles only)
// @Tags RBAC - Roles
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param id path int true "Role ID"
// @Success 200 {object} map[string]string "Role deleted successfully"
// @Router /rbac/roles/{id} [delete]
func (h Handler) DeleteRole(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		response.ResponseError(w, http.StatusBadRequest, "Invalid role ID")
		return
	}

	statusCode, err := h.service.DeleteRole(r.Context(), id)
	if err != nil {
		response.ResponseError(w, statusCode, err.Error())
		return
	}

	response.ResponseJSON(w, statusCode, map[string]string{"message": "Role deleted successfully"})
}

// --- Permission Handlers ---

// CreatePermission godoc
// @Summary Create permission
// @Description Create a new permission for a module
// @Tags RBAC - Permissions
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param request body CreatePermissionRequest true "Create permission request"
// @Success 201 {object} PermissionResponse
// @Router /rbac/permissions [post]
func (h Handler) CreatePermission(w http.ResponseWriter, r *http.Request) {
	var req CreatePermissionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.ResponseError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	permission, statusCode, err := h.service.CreatePermission(r.Context(), req)
	if err != nil {
		response.ResponseError(w, statusCode, err.Error())
		return
	}

	response.ResponseJSON(w, statusCode, permission)
}

// GetAllPermissions godoc
// @Summary Get all permissions
// @Description Get a list of all existing permissions
// @Tags RBAC - Permissions
// @Security BearerAuth
// @Accept json
// @Produce json
// @Success 200 {array} PermissionResponse
// @Router /rbac/permissions [get]
func (h Handler) GetAllPermissions(w http.ResponseWriter, r *http.Request) {
	permissions, statusCode, err := h.service.GetAllPermissions(r.Context())
	if err != nil {
		response.ResponseError(w, statusCode, err.Error())
		return
	}

	response.ResponseJSON(w, statusCode, permissions)
}

// GetPermissionsByModule godoc
// @Summary Get permissions grouped by module
// @Description Get all permissions grouped by their respective modules
// @Tags RBAC - Permissions
// @Security BearerAuth
// @Accept json
// @Produce json
// @Success 200 {array} PermissionsByModuleResponse
// @Router /rbac/permissions/by-module [get]
func (h Handler) GetPermissionsByModule(w http.ResponseWriter, r *http.Request) {
	permissions, statusCode, err := h.service.GetPermissionsByModule(r.Context())
	if err != nil {
		response.ResponseError(w, statusCode, err.Error())
		return
	}

	response.ResponseJSON(w, statusCode, permissions)
}

// GetPermissionByID godoc
// @Summary Get permission by ID
// @Description Get detailed information about a permission
// @Tags RBAC - Permissions
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param id path int true "Permission ID"
// @Success 200 {object} PermissionResponse
// @Router /rbac/permissions/{id} [get]
func (h Handler) GetPermissionByID(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		response.ResponseError(w, http.StatusBadRequest, "Invalid permission ID")
		return
	}

	permission, statusCode, err := h.service.GetPermissionByID(r.Context(), id)
	if err != nil {
		response.ResponseError(w, statusCode, err.Error())
		return
	}

	response.ResponseJSON(w, statusCode, permission)
}

// UpdatePermission godoc
// @Summary Update permission
// @Description Update permission information
// @Tags RBAC - Permissions
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param id path int true "Permission ID"
// @Param request body UpdatePermissionRequest true "Update permission request"
// @Success 200 {object} PermissionResponse
// @Router /rbac/permissions/{id} [put]
func (h Handler) UpdatePermission(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		response.ResponseError(w, http.StatusBadRequest, "Invalid permission ID")
		return
	}

	var req UpdatePermissionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.ResponseError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	permission, statusCode, err := h.service.UpdatePermission(r.Context(), id, req)
	if err != nil {
		response.ResponseError(w, statusCode, err.Error())
		return
	}

	response.ResponseJSON(w, statusCode, permission)
}

// DeletePermission godoc
// @Summary Delete permission
// @Description Permanently delete a permission
// @Tags RBAC - Permissions
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param id path int true "Permission ID"
// @Success 200 {object} map[string]string "Permission deleted successfully"
// @Router /rbac/permissions/{id} [delete]
func (h Handler) DeletePermission(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		response.ResponseError(w, http.StatusBadRequest, "Invalid permission ID")
		return
	}

	statusCode, err := h.service.DeletePermission(r.Context(), id)
	if err != nil {
		response.ResponseError(w, statusCode, err.Error())
		return
	}

	response.ResponseJSON(w, statusCode, map[string]string{"message": "Permission deleted successfully"})
}

// --- Role-Permission Handlers ---

// AssignPermissionsToRole godoc
// @Summary Assign permissions to role
// @Description Assign multiple permissions to a specific role
// @Tags RBAC - Role Permissions
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param id path int true "Role ID"
// @Param request body AssignPermissionsToRoleRequest true "Assign permissions request"
// @Success 200 {object} map[string]string "Permissions assigned successfully"
// @Router /rbac/roles/{id}/permissions [post]
func (h Handler) AssignPermissionsToRole(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		response.ResponseError(w, http.StatusBadRequest, "Invalid role ID")
		return
	}

	var req AssignPermissionsToRoleRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.ResponseError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	statusCode, err := h.service.AssignPermissionsToRole(r.Context(), id, req)
	if err != nil {
		response.ResponseError(w, statusCode, err.Error())
		return
	}

	response.ResponseJSON(w, statusCode, map[string]string{"message": "Permissions assigned successfully"})
}

// GetRolePermissions godoc
// @Summary Get role permissions
// @Description Get all permissions assigned to a specific role
// @Tags RBAC - Role Permissions
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param id path int true "Role ID"
// @Success 200 {array} PermissionResponse
// @Router /rbac/roles/{id}/permissions [get]
func (h Handler) GetRolePermissions(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		response.ResponseError(w, http.StatusBadRequest, "Invalid role ID")
		return
	}

	permissions, statusCode, err := h.service.GetRolePermissions(r.Context(), id)
	if err != nil {
		response.ResponseError(w, statusCode, err.Error())
		return
	}

	response.ResponseJSON(w, statusCode, permissions)
}

// --- User-Role Handlers ---

// AssignRolesToUser godoc
// @Summary Assign roles to user
// @Description Assign multiple roles to a user
// @Tags RBAC - User Roles
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param userId path string true "User UUID"
// @Param request body AssignRolesToUserRequest true "Assign roles request"
// @Success 200 {object} map[string]string "Roles assigned successfully"
// @Router /rbac/users/{userId}/roles [post]
func (h Handler) AssignRolesToUser(w http.ResponseWriter, r *http.Request) {
	userIDStr := chi.URLParam(r, "userId")
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		response.ResponseError(w, http.StatusBadRequest, "Invalid user ID")
		return
	}

	var req AssignRolesToUserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.ResponseError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	statusCode, err := h.service.AssignRolesToUser(r.Context(), userID, req)
	if err != nil {
		response.ResponseError(w, statusCode, err.Error())
		return
	}

	response.ResponseJSON(w, statusCode, map[string]string{"message": "Roles assigned successfully"})
}

// GetUserRoles godoc
// @Summary Get user roles
// @Description Get all roles assigned to a user
// @Tags RBAC - User Roles
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param userId path string true "User UUID"
// @Success 200 {object} UserRoleResponse
// @Router /rbac/users/{userId}/roles [get]
func (h Handler) GetUserRoles(w http.ResponseWriter, r *http.Request) {
	userIDStr := chi.URLParam(r, "userId")
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		response.ResponseError(w, http.StatusBadRequest, "Invalid user ID")
		return
	}

	roles, statusCode, err := h.service.GetUserRoles(r.Context(), userID)
	if err != nil {
		response.ResponseError(w, statusCode, err.Error())
		return
	}

	response.ResponseJSON(w, statusCode, roles)
}

// --- Module Access Handlers ---

// UpdateModuleAccess godoc
// @Summary Update module access for role
// @Description Update specific module permissions (view, create, edit, delete) for a role
// @Tags RBAC - Module Access
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param id path int true "Role ID"
// @Param request body UpdateModuleAccessRequest true "Update module access request"
// @Success 200 {object} ModuleAccessResponse
// @Router /rbac/roles/{id}/module-access [post]
func (h Handler) UpdateModuleAccess(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		response.ResponseError(w, http.StatusBadRequest, "Invalid role ID")
		return
	}

	var req UpdateModuleAccessRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.ResponseError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	moduleAccess, statusCode, err := h.service.UpdateModuleAccess(r.Context(), id, req)
	if err != nil {
		response.ResponseError(w, statusCode, err.Error())
		return
	}

	response.ResponseJSON(w, statusCode, moduleAccess)
}

// GetModuleAccessByRole godoc
// @Summary Get module access for role
// @Description Get all module access configurations for a role
// @Tags RBAC - Module Access
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param id path int true "Role ID"
// @Success 200 {array} ModuleAccessResponse
// @Router /rbac/roles/{id}/module-access [get]
func (h Handler) GetModuleAccessByRole(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		response.ResponseError(w, http.StatusBadRequest, "Invalid role ID")
		return
	}

	moduleAccess, statusCode, err := h.service.GetModuleAccessByRole(r.Context(), id)
	if err != nil {
		response.ResponseError(w, statusCode, err.Error())
		return
	}

	response.ResponseJSON(w, statusCode, moduleAccess)
}

// --- Permission Checking Handlers ---

// CheckPermission godoc
// @Summary Check user permission
// @Description Check if the currently logged-in user has a specific permission
// @Tags RBAC - Permission Checking
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param request body CheckPermissionRequest true "Check permission request"
// @Success 200 {object} CheckPermissionResponse
// @Router /rbac/check-permission [post]
func (h Handler) CheckPermission(w http.ResponseWriter, r *http.Request) {
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

	var req CheckPermissionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.ResponseError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	hasPermission, statusCode, err := h.service.CheckPermission(r.Context(), userID, req.Permission)
	if err != nil {
		response.ResponseError(w, statusCode, err.Error())
		return
	}

	response.ResponseJSON(w, statusCode, CheckPermissionResponse{HasPermission: hasPermission})
}

// CheckModuleAccess godoc
// @Summary Check module access
// @Description Check if the user has access to a specific action on a module
// @Tags RBAC - Permission Checking
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param request body CheckModuleAccessRequest true "Check module access request"
// @Success 200 {object} CheckModuleAccessResponse
// @Router /rbac/check-module-access [post]
func (h Handler) CheckModuleAccess(w http.ResponseWriter, r *http.Request) {
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

	var req CheckModuleAccessRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.ResponseError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	hasAccess, statusCode, err := h.service.CheckModuleAccess(r.Context(), userID, req.Module, req.Action)
	if err != nil {
		response.ResponseError(w, statusCode, err.Error())
		return
	}

	response.ResponseJSON(w, statusCode, CheckModuleAccessResponse{HasAccess: hasAccess})
}
