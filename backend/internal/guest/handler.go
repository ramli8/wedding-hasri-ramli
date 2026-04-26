package guest

import (
	"encoding/json"
	"io"
	"net/http"
	"strconv"

	"github.com/base-go/backend/pkg/response"
	"github.com/go-chi/chi/v5"
)

type Handler struct {
	service Service
}

func NewHandler(service Service) Handler {
	return Handler{
		service: service,
	}
}

// --- Guest Handlers ---

// CreateGuest godoc
// @Summary Create a new guest
// @Description Create a new guest with auto-generated unique QR code
// @Tags Guest
// @Accept json
// @Produce json
// @Param request body CreateGuestRequest true "Create guest request"
// @Success 201 {object} GuestResponse
// @Failure 400 {object} map[string]string "Invalid request body or validation failed"
// @Router /guests [post]
func (h Handler) CreateGuest(w http.ResponseWriter, r *http.Request) {
	var req CreateGuestRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.ResponseError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	res, statusCode, err := h.service.CreateGuest(r.Context(), req)
	if err != nil {
		response.ResponseError(w, statusCode, err.Error())
		return
	}

	response.ResponseJSON(w, statusCode, res)
}

// GetGuestByID godoc
// @Summary Get guest by ID
// @Description Get a single guest by its ID
// @Tags Guest
// @Accept json
// @Produce json
// @Param id path string true "Guest ID (UUID)"
// @Success 200 {object} GuestResponse
// @Failure 404 {object} map[string]string "Guest not found"
// @Router /guests/{id} [get]
func (h Handler) GetGuestByID(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	res, statusCode, err := h.service.GetGuestByID(r.Context(), id)
	if err != nil {
		response.ResponseError(w, statusCode, err.Error())
		return
	}

	response.ResponseJSON(w, statusCode, res)
}

// ListGuests godoc
// @Summary List all guests
// @Description Get a paginated list of guests with filters
// @Tags Guest
// @Accept json
// @Produce json
// @Param page query int false "Page number"
// @Param page_size query int false "Items per page"
// @Param search query string false "Search by name or QR code"
// @Param category_id query int false "Filter by category ID"
// @Param status_attending query string false "Filter by attending status"
// @Param status_sent query string false "Filter by sent status"
// @Success 200 {object} GuestListResponse
// @Router /guests [get]
func (h Handler) ListGuests(w http.ResponseWriter, r *http.Request) {
	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	pageSize, _ := strconv.Atoi(r.URL.Query().Get("page_size"))
	search := r.URL.Query().Get("search")
	categoryID, _ := strconv.Atoi(r.URL.Query().Get("category_id"))
	statusAttending := r.URL.Query().Get("status_attending")
	statusSent := r.URL.Query().Get("status_sent")
	isCheckedInStr := r.URL.Query().Get("is_checked_in")
	var isCheckedIn *bool
	if isCheckedInStr != "" {
		b, err := strconv.ParseBool(isCheckedInStr)
		if err == nil {
			isCheckedIn = &b
		}
	}
	sortBy := r.URL.Query().Get("sort_by")
	sortDir := r.URL.Query().Get("sort_dir")

	req := GuestListRequest{
		Page:            page,
		PageSize:        pageSize,
		Search:          search,
		CategoryID:      categoryID,
		StatusAttending: statusAttending,
		StatusSent:      statusSent,
		IsCheckedIn:     isCheckedIn,
		SortBy:          sortBy,
		SortDir:         sortDir,
	}

	res, statusCode, err := h.service.ListGuests(r.Context(), req)
	if err != nil {
		response.ResponseError(w, statusCode, err.Error())
		return
	}

	response.ResponseJSON(w, statusCode, res)
}

// ListDeletedGuests godoc
// @Summary List deleted guests
// @Description Get a paginated list of deleted guests
// @Tags Guest
// @Accept json
// @Produce json
// @Param page query int false "Page number"
// @Param page_size query int false "Items per page"
// @Param search query string false "Search by name or QR code"
// @Success 200 {object} GuestListResponse
// @Router /guests/deleted [get]
func (h Handler) ListDeletedGuests(w http.ResponseWriter, r *http.Request) {
	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	pageSize, _ := strconv.Atoi(r.URL.Query().Get("page_size"))
	search := r.URL.Query().Get("search")

	req := GuestListRequest{
		Page:     page,
		PageSize: pageSize,
		Search:   search,
	}

	res, statusCode, err := h.service.ListDeletedGuests(r.Context(), req)
	if err != nil {
		response.ResponseError(w, statusCode, err.Error())
		return
	}

	response.ResponseJSON(w, statusCode, res)
}

// UpdateGuest godoc
// @Summary Update guest
// @Description Update an existing guest's information
// @Tags Guest
// @Accept json
// @Produce json
// @Param id path string true "Guest ID (UUID)"
// @Param request body UpdateGuestRequest true "Update guest request"
// @Success 200 {object} GuestResponse
// @Failure 400 {object} map[string]string "Invalid request body or validation failed"
// @Failure 404 {object} map[string]string "Guest not found"
// @Router /guests/{id} [put]
func (h Handler) UpdateGuest(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var req UpdateGuestRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.ResponseError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	res, statusCode, err := h.service.UpdateGuest(r.Context(), id, req)
	if err != nil {
		response.ResponseError(w, statusCode, err.Error())
		return
	}

	response.ResponseJSON(w, statusCode, res)
}

// DeleteGuest godoc
// @Summary Delete guest
// @Description Soft delete a guest by its ID
// @Tags Guest
// @Accept json
// @Produce json
// @Param id path string true "Guest ID (UUID)"
// @Success 200 {object} map[string]string "Guest deleted"
// @Failure 404 {object} map[string]string "Guest not found"
// @Router /guests/{id} [delete]
func (h Handler) DeleteGuest(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	statusCode, err := h.service.DeleteGuest(r.Context(), id)
	if err != nil {
		response.ResponseError(w, statusCode, err.Error())
		return
	}

	response.ResponseJSON(w, statusCode, response.JSON{
		Code:    statusCode,
		Message: "Guest deleted successfully",
	})
}

// RestoreGuest godoc
// @Summary Restore guest
// @Description Restore a soft-deleted guest by its ID
// @Tags Guest
// @Accept json
// @Produce json
// @Param id path string true "Guest ID (UUID)"
// @Success 200 {object} map[string]string "Guest restored"
// @Failure 404 {object} map[string]string "Guest not found"
// @Router /guests/{id}/restore [post]
func (h Handler) RestoreGuest(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	statusCode, err := h.service.RestoreGuest(r.Context(), id)
	if err != nil {
		response.ResponseError(w, statusCode, err.Error())
		return
	}

	response.ResponseJSON(w, statusCode, response.JSON{
		Code:    statusCode,
		Message: "Guest restored successfully",
	})
}

// UpdateStatusSent godoc
// @Summary Update guest status_sent
// @Description Update the sent status of a guest
// @Tags Guest
// @Accept json
// @Produce json
// @Param id path string true "Guest ID (UUID)"
// @Param status query string true "Status (pending/sent)"
// @Success 200 {object} map[string]string "Status updated"
// @Router /guests/{id}/status-sent [put]
func (h Handler) UpdateStatusSent(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	status := r.URL.Query().Get("status")
	if status == "" {
		status = "sent"
	}

	statusCode, err := h.service.UpdateStatusSent(r.Context(), id, status)
	if err != nil {
		response.ResponseError(w, statusCode, err.Error())
		return
	}

	response.ResponseJSON(w, statusCode, response.JSON{
		Code:    statusCode,
		Message: "Status updated successfully",
	})
}

// ExportGuests godoc
// @Summary Export guests to Excel
// @Description Export all guests data to an Excel file
// @Tags Guest
// @Produce application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
// @Success 200 {file} binary
// @Router /guests/export [get]
func (h Handler) ExportGuests(w http.ResponseWriter, r *http.Request) {
	fileContent, err := h.service.ExportGuests(r.Context())
	if err != nil {
		response.ResponseError(w, http.StatusInternalServerError, err.Error())
		return
	}

	w.Header().Set("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
	w.Header().Set("Content-Disposition", "attachment; filename=guests_export.xlsx")
	w.Write(fileContent)
}

// GetImportTemplate godoc
// @Summary Get guest import template
// @Description Get an empty Excel template for importing guests
// @Tags Guest
// @Produce application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
// @Success 200 {file} binary
// @Router /guests/template [get]
func (h Handler) GetImportTemplate(w http.ResponseWriter, r *http.Request) {
	fileContent, err := h.service.GetImportTemplate(r.Context())
	if err != nil {
		response.ResponseError(w, http.StatusInternalServerError, err.Error())
		return
	}

	w.Header().Set("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
	w.Header().Set("Content-Disposition", "attachment; filename=guests_import_template.xlsx")
	w.Write(fileContent)
}

// PreviewImport godoc
// @Summary Preview guest import
// @Description Upload an Excel file to preview and validate guest data before importing
// @Tags Guest
// @Accept multipart/form-data
// @Produce json
// @Param file formData file true "Excel file"
// @Success 200 {object} GuestImportPreviewResponse
// @Router /guests/import/preview [post]
func (h Handler) PreviewImport(w http.ResponseWriter, r *http.Request) {
	err := r.ParseMultipartForm(10 << 20) // 10MB max
	if err != nil {
		response.ResponseError(w, http.StatusBadRequest, "Failed to parse form")
		return
	}

	file, _, err := r.FormFile("file")
	if err != nil {
		response.ResponseError(w, http.StatusBadRequest, "File is required")
		return
	}
	defer file.Close()

	fileBytes, err := io.ReadAll(file)
	if err != nil {
		response.ResponseError(w, http.StatusInternalServerError, "Failed to read file")
		return
	}

	res, statusCode, err := h.service.PreviewImport(r.Context(), fileBytes)
	if err != nil {
		response.ResponseError(w, statusCode, err.Error())
		return
	}

	response.ResponseJSON(w, statusCode, res)
}

// ExecuteImport godoc
// @Summary Execute guest import
// @Description Import a batch of validated guest data
// @Tags Guest
// @Accept json
// @Produce json
// @Param request body []CreateGuestRequest true "Batch guest data"
// @Success 200 {object} map[string]string "Import successful"
// @Router /guests/import/execute [post]
func (h Handler) ExecuteImport(w http.ResponseWriter, r *http.Request) {
	var req []CreateGuestRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.ResponseError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	statusCode, err := h.service.ExecuteImport(r.Context(), req)
	if err != nil {
		response.ResponseError(w, statusCode, err.Error())
		return
	}

	response.ResponseJSON(w, statusCode, response.JSON{
		Code:    statusCode,
		Message: "Import successful",
	})
}

// --- Guest Category Handlers ---

// CreateCategory godoc
// @Summary Create a new guest category
// @Description Create a new guest category with name and optional start/end times
// @Tags Guest
// @Accept json
// @Produce json
// @Param request body CreateGuestCategoryRequest true "Create guest category request"
// @Success 201 {object} GuestCategoryResponse
// @Failure 400 {object} map[string]string "Invalid request body"
// @Failure 409 {object} map[string]string "Category already exists"
// @Router /guests/categories [post]
func (h Handler) CreateCategory(w http.ResponseWriter, r *http.Request) {
	var req CreateGuestCategoryRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.ResponseError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	res, statusCode, err := h.service.CreateCategory(r.Context(), req)
	if err != nil {
		response.ResponseError(w, statusCode, err.Error())
		return
	}

	response.ResponseJSON(w, statusCode, res)
}

// GetCategoryByID godoc
// @Summary Get guest category by ID
// @Description Get a single guest category by its ID
// @Tags Guest
// @Accept json
// @Produce json
// @Param id path int true "Category ID"
// @Success 200 {object} GuestCategoryResponse
// @Failure 404 {object} map[string]string "Category not found"
// @Router /guests/categories/{id} [get]
func (h Handler) GetCategoryByID(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		response.ResponseError(w, http.StatusBadRequest, "Invalid category ID")
		return
	}

	res, statusCode, err := h.service.GetCategoryByID(r.Context(), id)
	if err != nil {
		response.ResponseError(w, statusCode, err.Error())
		return
	}

	response.ResponseJSON(w, statusCode, res)
}

// ListCategories godoc
// @Summary List all guest categories
// @Description Get a paginated list of guest categories with optional search
// @Tags Guest
// @Accept json
// @Produce json
// @Param page query int false "Page number"
// @Param page_size query int false "Items per page"
// @Param search query string false "Search by name"
// @Success 200 {object} GuestCategoryListResponse
// @Router /guests/categories [get]
func (h Handler) ListCategories(w http.ResponseWriter, r *http.Request) {
	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	pageSize, _ := strconv.Atoi(r.URL.Query().Get("page_size"))
	search := r.URL.Query().Get("search")

	req := GuestCategoryListRequest{
		Page:     page,
		PageSize: pageSize,
		Search:   search,
	}

	res, statusCode, err := h.service.ListCategories(r.Context(), req)
	if err != nil {
		response.ResponseError(w, statusCode, err.Error())
		return
	}

	response.ResponseJSON(w, statusCode, res)
}

// UpdateCategory godoc
// @Summary Update guest category
// @Description Update an existing guest category by its ID
// @Tags Guest
// @Accept json
// @Produce json
// @Param id path int true "Category ID"
// @Param request body UpdateGuestCategoryRequest true "Update guest category request"
// @Success 200 {object} GuestCategoryResponse
// @Failure 400 {object} map[string]string "Invalid request body"
// @Failure 404 {object} map[string]string "Category not found"
// @Router /guests/categories/{id} [put]
func (h Handler) UpdateCategory(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		response.ResponseError(w, http.StatusBadRequest, "Invalid category ID")
		return
	}

	var req UpdateGuestCategoryRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.ResponseError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	res, statusCode, err := h.service.UpdateCategory(r.Context(), id, req)
	if err != nil {
		response.ResponseError(w, statusCode, err.Error())
		return
	}

	response.ResponseJSON(w, statusCode, res)
}

// DeleteCategory godoc
// @Summary Delete guest category
// @Description Delete a guest category by its ID
// @Tags Guest
// @Accept json
// @Produce json
// @Param id path int true "Category ID"
// @Success 200 {object} map[string]string "Category deleted"
// @Failure 404 {object} map[string]string "Category not found"
// @Router /guests/categories/{id} [delete]
func (h Handler) DeleteCategory(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		response.ResponseError(w, http.StatusBadRequest, "Invalid category ID")
		return
	}

	statusCode, err := h.service.DeleteCategory(r.Context(), id)
	if err != nil {
		response.ResponseError(w, statusCode, err.Error())
		return
	}

	response.ResponseJSON(w, statusCode, response.JSON{
		Code:    statusCode,
		Message: "Guest category deleted successfully",
	})
}
