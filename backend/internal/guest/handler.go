package guest

import (
	"encoding/json"
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

// CreateCategory godoc
// @Summary Create a new guest category
// @Description Create a new guest category with name and optional start/end times
// @Tags Guest
// @Accept json
// @Produce json
// @Param request body CreateCategoryRequest true "Create guest category request"
// @Success 201 {object} CategoryResponse
// @Failure 400 {object} map[string]string "Invalid request body"
// @Failure 409 {object} map[string]string "Category already exists"
// @Router /guests/categories [post]
func (h Handler) CreateCategory(w http.ResponseWriter, r *http.Request) {
	var req CreateCategoryRequest
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
// @Success 200 {object} CategoryResponse
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
// @Success 200 {object} CategoryListResponse
// @Router /guests/categories [get]
func (h Handler) ListCategories(w http.ResponseWriter, r *http.Request) {
	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	pageSize, _ := strconv.Atoi(r.URL.Query().Get("page_size"))
	search := r.URL.Query().Get("search")

	req := CategoryListRequest{
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
// @Param request body UpdateCategoryRequest true "Update guest category request"
// @Success 200 {object} CategoryResponse
// @Failure 400 {object} map[string]string "Invalid request body"
// @Failure 404 {object} map[string]string "Category not found"
// @Router /guests/categories/{id} [put]
func (h Handler) UpdateCategory(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		response.ResponseError(w, http.StatusBadRequest, "Invalid category ID")
		return
	}

	var req UpdateCategoryRequest
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
