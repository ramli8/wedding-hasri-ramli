package vendor

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
	return Handler{service: service}
}

// --- Overview ---

// GetOverview godoc
// @Summary Get complete vendor overview
// @Description Get all categories with attributes, vendors, and payments for an event
// @Tags Vendor
// @Accept json
// @Produce json
// @Param event_id query string true "Event ID (UUID)"
// @Success 200 {object} OverviewResponse
// @Router /vendors/overview [get]
func (h Handler) GetOverview(w http.ResponseWriter, r *http.Request) {
	eventID := r.URL.Query().Get("event_id")
	if eventID == "" {
		response.ResponseError(w, http.StatusBadRequest, "event_id is required")
		return
	}

	res, statusCode, err := h.service.GetOverview(r.Context(), eventID)
	if err != nil {
		response.ResponseError(w, statusCode, err.Error())
		return
	}

	response.ResponseJSON(w, statusCode, res)
}

// --- Category Handlers ---

// CreateCategory godoc
// @Summary Create a new vendor category
// @Description Create a new vendor category for an event
// @Tags Vendor
// @Accept json
// @Produce json
// @Param request body CreateCategoryRequest true "Create category request"
// @Success 201 {object} CategoryResponse
// @Failure 400 {object} map[string]string "Invalid request body or validation failed"
// @Failure 409 {object} map[string]string "Category already exists"
// @Router /vendors/categories [post]
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

// ListCategories godoc
// @Summary List vendor categories
// @Description Get all vendor categories for an event
// @Tags Vendor
// @Accept json
// @Produce json
// @Param event_id query string true "Event ID (UUID)"
// @Success 200 {object} CategoryListResponse
// @Router /vendors/categories [get]
func (h Handler) ListCategories(w http.ResponseWriter, r *http.Request) {
	eventID := r.URL.Query().Get("event_id")
	if eventID == "" {
		response.ResponseError(w, http.StatusBadRequest, "event_id is required")
		return
	}

	res, statusCode, err := h.service.ListCategories(r.Context(), eventID)
	if err != nil {
		response.ResponseError(w, statusCode, err.Error())
		return
	}

	response.ResponseJSON(w, statusCode, res)
}

// GetCategoryByID godoc
// @Summary Get vendor category by ID
// @Description Get a single vendor category with its attributes and vendors
// @Tags Vendor
// @Accept json
// @Produce json
// @Param id path int true "Category ID"
// @Success 200 {object} CategoryResponse
// @Failure 404 {object} map[string]string "Category not found"
// @Router /vendors/categories/{id} [get]
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

// UpdateCategory godoc
// @Summary Update vendor category
// @Description Update an existing vendor category's name
// @Tags Vendor
// @Accept json
// @Produce json
// @Param id path int true "Category ID"
// @Param request body UpdateCategoryRequest true "Update category request"
// @Success 200 {object} CategoryResponse
// @Failure 400 {object} map[string]string "Invalid request body"
// @Failure 404 {object} map[string]string "Category not found"
// @Router /vendors/categories/{id} [put]
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
// @Summary Delete vendor category
// @Description Delete a vendor category and all associated data
// @Tags Vendor
// @Accept json
// @Produce json
// @Param id path int true "Category ID"
// @Success 200 {object} map[string]string "Category deleted"
// @Failure 404 {object} map[string]string "Category not found"
// @Router /vendors/categories/{id} [delete]
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
		Message: "Vendor category deleted successfully",
	})
}

// SelectVendor godoc
// @Summary Select a vendor for a category
// @Description Mark a vendor as selected for a specific category
// @Tags Vendor
// @Accept json
// @Produce json
// @Param id path int true "Category ID"
// @Param vendorId path string true "Vendor ID (UUID)"
// @Success 200 {object} SelectVendorResponse
// @Failure 404 {object} map[string]string "Category or vendor not found"
// @Router /vendors/categories/{id}/select/{vendorId} [post]
func (h Handler) SelectVendor(w http.ResponseWriter, r *http.Request) {
	categoryID, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		response.ResponseError(w, http.StatusBadRequest, "Invalid category ID")
		return
	}

	vendorID := chi.URLParam(r, "vendorId")
	if vendorID == "" {
		response.ResponseError(w, http.StatusBadRequest, "Vendor ID is required")
		return
	}

	res, statusCode, err := h.service.SelectVendor(r.Context(), categoryID, vendorID)
	if err != nil {
		response.ResponseError(w, statusCode, err.Error())
		return
	}

	response.ResponseJSON(w, statusCode, res)
}

// DeselectVendor godoc
// @Summary Deselect vendor for a category
// @Description Remove the selected vendor for a category
// @Tags Vendor
// @Accept json
// @Produce json
// @Param id path int true "Category ID"
// @Success 200 {object} SelectVendorResponse
// @Failure 404 {object} map[string]string "Category not found"
// @Router /vendors/categories/{id}/select [delete]
func (h Handler) DeselectVendor(w http.ResponseWriter, r *http.Request) {
	categoryID, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		response.ResponseError(w, http.StatusBadRequest, "Invalid category ID")
		return
	}

	res, statusCode, err := h.service.DeselectVendor(r.Context(), categoryID)
	if err != nil {
		response.ResponseError(w, statusCode, err.Error())
		return
	}

	response.ResponseJSON(w, statusCode, res)
}

// --- Attribute Handlers ---

// CreateAttribute godoc
// @Summary Create attribute for category
// @Description Create a new comparison attribute for a vendor category
// @Tags Vendor
// @Accept json
// @Produce json
// @Param id path int true "Category ID"
// @Param request body CreateAttributeRequest true "Create attribute request"
// @Success 201 {object} AttributeResponse
// @Failure 400 {object} map[string]string "Invalid request body"
// @Failure 404 {object} map[string]string "Category not found"
// @Router /vendors/categories/{id}/attributes [post]
func (h Handler) CreateAttribute(w http.ResponseWriter, r *http.Request) {
	categoryID, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		response.ResponseError(w, http.StatusBadRequest, "Invalid category ID")
		return
	}

	var req CreateAttributeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.ResponseError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	res, statusCode, err := h.service.CreateAttribute(r.Context(), categoryID, req)
	if err != nil {
		response.ResponseError(w, statusCode, err.Error())
		return
	}

	response.ResponseJSON(w, statusCode, res)
}

// ListAttributes godoc
// @Summary List attributes for category
// @Description Get all comparison attributes for a vendor category
// @Tags Vendor
// @Accept json
// @Produce json
// @Param id path int true "Category ID"
// @Success 200 {array} AttributeResponse
// @Failure 404 {object} map[string]string "Category not found"
// @Router /vendors/categories/{id}/attributes [get]
func (h Handler) ListAttributes(w http.ResponseWriter, r *http.Request) {
	categoryID, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		response.ResponseError(w, http.StatusBadRequest, "Invalid category ID")
		return
	}

	res, statusCode, err := h.service.ListAttributes(r.Context(), categoryID)
	if err != nil {
		response.ResponseError(w, statusCode, err.Error())
		return
	}

	response.ResponseJSON(w, statusCode, res)
}

// UpdateAttribute godoc
// @Summary Update attribute
// @Description Update a comparison attribute
// @Tags Vendor
// @Accept json
// @Produce json
// @Param id path int true "Attribute ID"
// @Param request body UpdateAttributeRequest true "Update attribute request"
// @Success 200 {object} AttributeResponse
// @Failure 400 {object} map[string]string "Invalid request body"
// @Failure 404 {object} map[string]string "Attribute not found"
// @Router /vendors/attributes/{id} [put]
func (h Handler) UpdateAttribute(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		response.ResponseError(w, http.StatusBadRequest, "Invalid attribute ID")
		return
	}

	var req UpdateAttributeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.ResponseError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	res, statusCode, err := h.service.UpdateAttribute(r.Context(), id, req)
	if err != nil {
		response.ResponseError(w, statusCode, err.Error())
		return
	}

	response.ResponseJSON(w, statusCode, res)
}

// DeleteAttribute godoc
// @Summary Delete attribute
// @Description Delete a comparison attribute and all its values
// @Tags Vendor
// @Accept json
// @Produce json
// @Param id path int true "Attribute ID"
// @Success 200 {object} map[string]string "Attribute deleted"
// @Failure 404 {object} map[string]string "Attribute not found"
// @Router /vendors/attributes/{id} [delete]
func (h Handler) DeleteAttribute(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		response.ResponseError(w, http.StatusBadRequest, "Invalid attribute ID")
		return
	}

	statusCode, err := h.service.DeleteAttribute(r.Context(), id)
	if err != nil {
		response.ResponseError(w, statusCode, err.Error())
		return
	}

	response.ResponseJSON(w, statusCode, response.JSON{
		Code:    statusCode,
		Message: "Attribute deleted successfully",
	})
}

// --- Vendor Handlers ---

// CreateVendor godoc
// @Summary Create a new vendor
// @Description Create a new vendor in a category with optional attribute values
// @Tags Vendor
// @Accept json
// @Produce json
// @Param id path int true "Category ID"
// @Param request body CreateVendorRequest true "Create vendor request"
// @Success 201 {object} VendorResponse
// @Failure 400 {object} map[string]string "Invalid request body"
// @Failure 404 {object} map[string]string "Category not found"
// @Router /vendors/categories/{id}/vendors [post]
func (h Handler) CreateVendor(w http.ResponseWriter, r *http.Request) {
	categoryID, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		response.ResponseError(w, http.StatusBadRequest, "Invalid category ID")
		return
	}

	var req CreateVendorRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.ResponseError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	res, statusCode, err := h.service.CreateVendor(r.Context(), categoryID, req)
	if err != nil {
		response.ResponseError(w, statusCode, err.Error())
		return
	}

	response.ResponseJSON(w, statusCode, res)
}

// ListVendors godoc
// @Summary List vendors in category
// @Description Get all vendors in a category with their attribute values and payments
// @Tags Vendor
// @Accept json
// @Produce json
// @Param id path int true "Category ID"
// @Success 200 {array} VendorResponse
// @Failure 404 {object} map[string]string "Category not found"
// @Router /vendors/categories/{id}/vendors [get]
func (h Handler) ListVendors(w http.ResponseWriter, r *http.Request) {
	categoryID, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		response.ResponseError(w, http.StatusBadRequest, "Invalid category ID")
		return
	}

	res, statusCode, err := h.service.ListVendors(r.Context(), categoryID)
	if err != nil {
		response.ResponseError(w, statusCode, err.Error())
		return
	}

	response.ResponseJSON(w, statusCode, res)
}

// GetVendorByID godoc
// @Summary Get vendor by ID
// @Description Get a single vendor with attribute values and payments
// @Tags Vendor
// @Accept json
// @Produce json
// @Param id path string true "Vendor ID (UUID)"
// @Success 200 {object} VendorResponse
// @Failure 404 {object} map[string]string "Vendor not found"
// @Router /vendors/{id} [get]
func (h Handler) GetVendorByID(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	res, statusCode, err := h.service.GetVendorByID(r.Context(), id)
	if err != nil {
		response.ResponseError(w, statusCode, err.Error())
		return
	}

	response.ResponseJSON(w, statusCode, res)
}

// UpdateVendor godoc
// @Summary Update vendor
// @Description Update an existing vendor's information
// @Tags Vendor
// @Accept json
// @Produce json
// @Param id path string true "Vendor ID (UUID)"
// @Param request body UpdateVendorRequest true "Update vendor request"
// @Success 200 {object} VendorResponse
// @Failure 400 {object} map[string]string "Invalid request body"
// @Failure 404 {object} map[string]string "Vendor not found"
// @Router /vendors/{id} [put]
func (h Handler) UpdateVendor(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	var req UpdateVendorRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.ResponseError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	res, statusCode, err := h.service.UpdateVendor(r.Context(), id, req)
	if err != nil {
		response.ResponseError(w, statusCode, err.Error())
		return
	}

	response.ResponseJSON(w, statusCode, res)
}

// DeleteVendor godoc
// @Summary Delete vendor
// @Description Soft delete a vendor by its ID
// @Tags Vendor
// @Accept json
// @Produce json
// @Param id path string true "Vendor ID (UUID)"
// @Success 200 {object} map[string]string "Vendor deleted"
// @Failure 404 {object} map[string]string "Vendor not found"
// @Router /vendors/{id} [delete]
func (h Handler) DeleteVendor(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	statusCode, err := h.service.DeleteVendor(r.Context(), id)
	if err != nil {
		response.ResponseError(w, statusCode, err.Error())
		return
	}

	response.ResponseJSON(w, statusCode, response.JSON{
		Code:    statusCode,
		Message: "Vendor deleted successfully",
	})
}

// UpdateAttributeValues godoc
// @Summary Update vendor attribute values
// @Description Batch update attribute values for a vendor
// @Tags Vendor
// @Accept json
// @Produce json
// @Param id path string true "Vendor ID (UUID)"
// @Param request body UpdateAttributeValuesRequest true "Attribute values"
// @Success 200 {object} map[string]string "Attribute values updated"
// @Failure 404 {object} map[string]string "Vendor not found"
// @Router /vendors/{id}/attribute-values [put]
func (h Handler) UpdateAttributeValues(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	var req UpdateAttributeValuesRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.ResponseError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	statusCode, err := h.service.UpdateAttributeValues(r.Context(), id, req)
	if err != nil {
		response.ResponseError(w, statusCode, err.Error())
		return
	}

	response.ResponseJSON(w, statusCode, response.JSON{
		Code:    statusCode,
		Message: "Attribute values updated successfully",
	})
}

// --- Payment Handlers ---

// CreatePayment godoc
// @Summary Create a payment record
// @Description Add a payment record for a vendor
// @Tags Vendor
// @Accept json
// @Produce json
// @Param id path string true "Vendor ID (UUID)"
// @Param request body CreatePaymentRequest true "Create payment request"
// @Success 201 {object} PaymentResponse
// @Failure 400 {object} map[string]string "Invalid request body"
// @Failure 404 {object} map[string]string "Vendor not found"
// @Router /vendors/{id}/payments [post]
func (h Handler) CreatePayment(w http.ResponseWriter, r *http.Request) {
	vendorID := chi.URLParam(r, "id")

	var req CreatePaymentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.ResponseError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	res, statusCode, err := h.service.CreatePayment(r.Context(), vendorID, req)
	if err != nil {
		response.ResponseError(w, statusCode, err.Error())
		return
	}

	response.ResponseJSON(w, statusCode, res)
}

// ListPayments godoc
// @Summary List payments for vendor
// @Description Get all payment records for a vendor
// @Tags Vendor
// @Accept json
// @Produce json
// @Param id path string true "Vendor ID (UUID)"
// @Success 200 {array} PaymentResponse
// @Failure 404 {object} map[string]string "Vendor not found"
// @Router /vendors/{id}/payments [get]
func (h Handler) ListPayments(w http.ResponseWriter, r *http.Request) {
	vendorID := chi.URLParam(r, "id")

	res, statusCode, err := h.service.ListPayments(r.Context(), vendorID)
	if err != nil {
		response.ResponseError(w, statusCode, err.Error())
		return
	}

	response.ResponseJSON(w, statusCode, res)
}

// UpdatePayment godoc
// @Summary Update payment record
// @Description Update an existing payment record
// @Tags Vendor
// @Accept json
// @Produce json
// @Param id path int true "Payment ID"
// @Param request body UpdatePaymentRequest true "Update payment request"
// @Success 200 {object} PaymentResponse
// @Failure 400 {object} map[string]string "Invalid request body"
// @Failure 404 {object} map[string]string "Payment not found"
// @Router /vendors/payments/{id} [put]
func (h Handler) UpdatePayment(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		response.ResponseError(w, http.StatusBadRequest, "Invalid payment ID")
		return
	}

	var req UpdatePaymentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.ResponseError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	res, statusCode, err := h.service.UpdatePayment(r.Context(), id, req)
	if err != nil {
		response.ResponseError(w, statusCode, err.Error())
		return
	}

	response.ResponseJSON(w, statusCode, res)
}

// DeletePayment godoc
// @Summary Delete payment record
// @Description Delete a payment record by its ID
// @Tags Vendor
// @Accept json
// @Produce json
// @Param id path int true "Payment ID"
// @Success 200 {object} map[string]string "Payment deleted"
// @Failure 404 {object} map[string]string "Payment not found"
// @Router /vendors/payments/{id} [delete]
func (h Handler) DeletePayment(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		response.ResponseError(w, http.StatusBadRequest, "Invalid payment ID")
		return
	}

	statusCode, err := h.service.DeletePayment(r.Context(), id)
	if err != nil {
		response.ResponseError(w, statusCode, err.Error())
		return
	}

	response.ResponseJSON(w, statusCode, response.JSON{
		Code:    statusCode,
		Message: "Payment deleted successfully",
	})
}
