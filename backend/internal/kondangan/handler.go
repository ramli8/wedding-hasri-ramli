package kondangan

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/base-go/backend/pkg/response"
	"github.com/go-chi/chi/v5"
	"github.com/go-playground/validator/v10"
)

type Handler interface {
	Create(w http.ResponseWriter, r *http.Request)
	GetByID(w http.ResponseWriter, r *http.Request)
	List(w http.ResponseWriter, r *http.Request)
	Update(w http.ResponseWriter, r *http.Request)
	Delete(w http.ResponseWriter, r *http.Request)
	GetStats(w http.ResponseWriter, r *http.Request)

	// Relations
	CreateRelation(w http.ResponseWriter, r *http.Request)
	DeleteRelation(w http.ResponseWriter, r *http.Request)
	ListRelations(w http.ResponseWriter, r *http.Request)
}

type handler struct {
	service  Service
	validate *validator.Validate
}

func NewHandler(service Service) Handler {
	return &handler{
		service:  service,
		validate: validator.New(),
	}
}

// Create godoc
// @Summary Create a new kondangan record
// @Description Create a new kondangan record with the provided details
// @Tags Kondangan
// @Accept json
// @Produce json
// @Param request body CreateKondanganRequest true "Kondangan details"
// @Success 201 {object} response.JSON{data=KondanganResponse}
// @Failure 400 {object} response.JSON
// @Failure 500 {object} response.JSON
// @Security BearerAuth
// @Router /v1/kondangan [post]
func (h *handler) Create(w http.ResponseWriter, r *http.Request) {
	var req CreateKondanganRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.ResponseError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	if err := h.validate.Struct(req); err != nil {
		response.ResponseError(w, http.StatusBadRequest, err.Error())
		return
	}

	res, err := h.service.Create(r.Context(), req)
	if err != nil {
		response.ResponseError(w, http.StatusInternalServerError, err.Error())
		return
	}

	response.ResponseJSON(w, http.StatusCreated, response.JSON{
		Code:    http.StatusCreated,
		Message: "Kondangan record created successfully",
		Data:    res,
	})
}

// GetByID godoc
// @Summary Get kondangan by ID
// @Description Get a kondangan record by its ID
// @Tags Kondangan
// @Accept json
// @Produce json
// @Param id path string true "Kondangan ID"
// @Success 200 {object} response.JSON{data=KondanganResponse}
// @Failure 404 {object} response.JSON
// @Failure 500 {object} response.JSON
// @Security BearerAuth
// @Router /v1/kondangan/{id} [get]
func (h *handler) GetByID(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		response.ResponseError(w, http.StatusBadRequest, "ID is required")
		return
	}

	res, err := h.service.GetByID(r.Context(), id)
	if err != nil {
		if err == ErrKondanganNotFound {
			response.ResponseError(w, http.StatusNotFound, err.Error())
			return
		}
		response.ResponseError(w, http.StatusInternalServerError, err.Error())
		return
	}

	response.ResponseJSON(w, http.StatusOK, response.JSON{
		Code:    http.StatusOK,
		Message: "Success retrieving kondangan record",
		Data:    res,
	})
}

// List godoc
// @Summary List kondangan records
// @Description Get a paginated list of kondangan records with optional filtering and sorting
// @Tags Kondangan
// @Accept json
// @Produce json
// @Param page query int false "Page number"
// @Param page_size query int false "Page size"
// @Param search query string false "Search query"
// @Param relation query string false "Filter by relation"
// @Param side query string false "Filter by side"
// @Param sort_by query string false "Sort field"
// @Param sort_dir query string false "Sort direction (asc/desc)"
// @Success 200 {object} response.JSON{data=KondanganListResponse}
// @Failure 500 {object} response.JSON
// @Security BearerAuth
// @Router /v1/kondangan [get]
func (h *handler) List(w http.ResponseWriter, r *http.Request) {
	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	pageSize, _ := strconv.Atoi(r.URL.Query().Get("page_size"))
	idRelation, _ := strconv.Atoi(r.URL.Query().Get("relation_id"))

	req := KondanganListRequest{
		Page:       page,
		PageSize:   pageSize,
		Search:     r.URL.Query().Get("search"),
		RelationID: idRelation,
		Side:       r.URL.Query().Get("side"),
		SortBy:     r.URL.Query().Get("sort_by"),
		SortDir:    r.URL.Query().Get("sort_dir"),
	}

	res, err := h.service.List(r.Context(), req)
	if err != nil {
		response.ResponseError(w, http.StatusInternalServerError, err.Error())
		return
	}

	response.ResponseJSON(w, http.StatusOK, response.JSON{
		Code:    http.StatusOK,
		Message: "Success retrieving kondangan list",
		Data:    res,
	})
}

// Update godoc
// @Summary Update kondangan record
// @Description Update an existing kondangan record
// @Tags Kondangan
// @Accept json
// @Produce json
// @Param id path string true "Kondangan ID"
// @Param request body UpdateKondanganRequest true "Update details"
// @Success 200 {object} response.JSON{data=KondanganResponse}
// @Failure 400 {object} response.JSON
// @Failure 404 {object} response.JSON
// @Failure 500 {object} response.JSON
// @Security BearerAuth
// @Router /v1/kondangan/{id} [put]
func (h *handler) Update(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		response.ResponseError(w, http.StatusBadRequest, "ID is required")
		return
	}

	var req UpdateKondanganRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.ResponseError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	if err := h.validate.Struct(req); err != nil {
		response.ResponseError(w, http.StatusBadRequest, err.Error())
		return
	}

	res, err := h.service.Update(r.Context(), id, req)
	if err != nil {
		if err == ErrKondanganNotFound {
			response.ResponseError(w, http.StatusNotFound, err.Error())
			return
		}
		response.ResponseError(w, http.StatusInternalServerError, err.Error())
		return
	}

	response.ResponseJSON(w, http.StatusOK, response.JSON{
		Code:    http.StatusOK,
		Message: "Kondangan record updated successfully",
		Data:    res,
	})
}

// Delete godoc
// @Summary Delete kondangan record
// @Description Soft delete a kondangan record by its ID
// @Tags Kondangan
// @Accept json
// @Produce json
// @Param id path string true "Kondangan ID"
// @Success 200 {object} response.JSON
// @Failure 404 {object} response.JSON
// @Failure 500 {object} response.JSON
// @Security BearerAuth
// @Router /v1/kondangan/{id} [delete]
func (h *handler) Delete(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		response.ResponseError(w, http.StatusBadRequest, "ID is required")
		return
	}

	err := h.service.Delete(r.Context(), id)
	if err != nil {
		if err == ErrKondanganNotFound {
			response.ResponseError(w, http.StatusNotFound, err.Error())
			return
		}
		response.ResponseError(w, http.StatusInternalServerError, err.Error())
		return
	}

	response.ResponseJSON(w, http.StatusOK, response.JSON{
		Code:    http.StatusOK,
		Message: "Kondangan record deleted successfully",
	})
}

// GetStats godoc
// @Summary Get kondangan statistics
// @Description Get summary statistics for all kondangan records
// @Tags Kondangan
// @Accept json
// @Produce json
// @Success 200 {object} response.JSON{data=KondanganStatsResponse}
// @Failure 500 {object} response.JSON
// @Security BearerAuth
// @Router /v1/kondangan/stats [get]
func (h *handler) GetStats(w http.ResponseWriter, r *http.Request) {
	res, err := h.service.GetStats(r.Context())
	if err != nil {
		response.ResponseError(w, http.StatusInternalServerError, err.Error())
		return
	}

	response.ResponseJSON(w, http.StatusOK, response.JSON{
		Code:    http.StatusOK,
		Message: "Success retrieving kondangan stats",
		Data:    res,
	})
}

// CreateRelation godoc
// @Summary Create a new relation category
// @Tags Kondangan Relations
// @Accept json
// @Produce json
// @Param request body CreateKondanganRelationRequest true "Relation details"
// @Success 201 {object} response.JSON{data=KondanganRelationResponse}
// @Security BearerAuth
// @Router /v1/kondangan/relations [post]
func (h *handler) CreateRelation(w http.ResponseWriter, r *http.Request) {
	var req CreateKondanganRelationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.ResponseError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	if err := h.validate.Struct(req); err != nil {
		response.ResponseError(w, http.StatusBadRequest, err.Error())
		return
	}

	res, err := h.service.CreateRelation(r.Context(), req)
	if err != nil {
		response.ResponseError(w, http.StatusInternalServerError, err.Error())
		return
	}

	response.ResponseJSON(w, http.StatusCreated, response.JSON{
		Code:    http.StatusCreated,
		Message: "Relation created successfully",
		Data:    res,
	})
}

// ListRelations godoc
// @Summary List all relation categories
// @Tags Kondangan Relations
// @Produce json
// @Success 200 {object} response.JSON{data=[]KondanganRelationResponse}
// @Security BearerAuth
// @Router /v1/kondangan/relations [get]
func (h *handler) ListRelations(w http.ResponseWriter, r *http.Request) {
	res, err := h.service.ListRelations(r.Context())
	if err != nil {
		response.ResponseError(w, http.StatusInternalServerError, err.Error())
		return
	}

	response.ResponseJSON(w, http.StatusOK, response.JSON{
		Code:    http.StatusOK,
		Message: "Success retrieving relations list",
		Data:    res,
	})
}

// DeleteRelation godoc
// @Summary Delete relation category
// @Tags Kondangan Relations
// @Param id path int true "Relation ID"
// @Success 200 {object} response.JSON
// @Security BearerAuth
// @Router /v1/kondangan/relations/{id} [delete]
func (h *handler) DeleteRelation(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil || id <= 0 {
		response.ResponseError(w, http.StatusBadRequest, "Invalid ID")
		return
	}

	if err := h.service.DeleteRelation(r.Context(), id); err != nil {
		response.ResponseError(w, http.StatusInternalServerError, err.Error())
		return
	}

	response.ResponseJSON(w, http.StatusOK, response.JSON{
		Code:    http.StatusOK,
		Message: "Relation deleted successfully",
	})
}
