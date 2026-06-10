package vendor

import (
	"context"
	"math"
	"net/http"
	"time"

	"github.com/base-go/backend/internal/shared/models"
	"github.com/base-go/backend/pkg/validator"
)

type Service interface {
	// Category operations
	CreateCategory(ctx context.Context, req CreateCategoryRequest) (CategoryResponse, int, error)
	ListCategories(ctx context.Context, eventID string) (CategoryListResponse, int, error)
	GetCategoryByID(ctx context.Context, id int) (CategoryResponse, int, error)
	UpdateCategory(ctx context.Context, id int, req UpdateCategoryRequest) (CategoryResponse, int, error)
	DeleteCategory(ctx context.Context, id int) (int, error)
	SelectVendor(ctx context.Context, categoryID int, vendorID string) (SelectVendorResponse, int, error)
	DeselectVendor(ctx context.Context, categoryID int) (SelectVendorResponse, int, error)

	// Attribute operations
	CreateAttribute(ctx context.Context, categoryID int, req CreateAttributeRequest) (AttributeResponse, int, error)
	ListAttributes(ctx context.Context, categoryID int) ([]AttributeResponse, int, error)
	UpdateAttribute(ctx context.Context, id int, req UpdateAttributeRequest) (AttributeResponse, int, error)
	DeleteAttribute(ctx context.Context, id int) (int, error)

	// Vendor operations
	CreateVendor(ctx context.Context, categoryID int, req CreateVendorRequest) (VendorResponse, int, error)
	GetVendorByID(ctx context.Context, id string) (VendorResponse, int, error)
	ListVendors(ctx context.Context, categoryID int) ([]VendorResponse, int, error)
	UpdateVendor(ctx context.Context, id string, req UpdateVendorRequest) (VendorResponse, int, error)
	DeleteVendor(ctx context.Context, id string) (int, error)

	// Attribute Value operations
	UpdateAttributeValues(ctx context.Context, vendorID string, req UpdateAttributeValuesRequest) (int, error)

	// Payment operations
	CreatePayment(ctx context.Context, vendorID string, req CreatePaymentRequest) (PaymentResponse, int, error)
	ListPayments(ctx context.Context, vendorID string) ([]PaymentResponse, int, error)
	UpdatePayment(ctx context.Context, id int, req UpdatePaymentRequest) (PaymentResponse, int, error)
	DeletePayment(ctx context.Context, id int) (int, error)

	// Overview
	GetOverview(ctx context.Context, eventID string) (OverviewResponse, int, error)
}

type service struct {
	repo Repository
}

func NewService(repo Repository) Service {
	return &service{repo: repo}
}

// --- Category Service ---

func (s *service) CreateCategory(ctx context.Context, req CreateCategoryRequest) (CategoryResponse, int, error) {
	if err := validator.ValidateStruct(req); err != nil {
		return CategoryResponse{}, http.StatusBadRequest, err
	}

	category := &models.VendorCategory{
		EventID: req.EventID,
		Name:    req.Name,
	}

	if err := s.repo.CreateCategory(ctx, category); err != nil {
		if err == ErrCategoryAlreadyExists {
			return CategoryResponse{}, http.StatusConflict, err
		}
		return CategoryResponse{}, http.StatusInternalServerError, err
	}

	return s.mapCategoryToResponse(category), http.StatusCreated, nil
}

func (s *service) ListCategories(ctx context.Context, eventID string) (CategoryListResponse, int, error) {
	if eventID == "" {
		return CategoryListResponse{}, http.StatusBadRequest, ErrCategoryNotFound
	}

	categories, err := s.repo.ListCategories(ctx, eventID)
	if err != nil {
		return CategoryListResponse{}, http.StatusInternalServerError, err
	}

	items := make([]CategoryResponse, len(categories))
	for i, c := range categories {
		items[i] = s.mapCategoryToResponse(&c)
	}

	return CategoryListResponse{
		Items:      items,
		Total:      int64(len(items)),
		Page:       1,
		PageSize:   len(items),
		TotalPages: 1,
	}, http.StatusOK, nil
}

func (s *service) GetCategoryByID(ctx context.Context, id int) (CategoryResponse, int, error) {
	category, err := s.repo.GetCategoryByID(ctx, id)
	if err != nil {
		if err == ErrCategoryNotFound {
			return CategoryResponse{}, http.StatusNotFound, err
		}
		return CategoryResponse{}, http.StatusInternalServerError, err
	}

	attrs, _ := s.repo.ListAttributes(ctx, id)
	vendors, _ := s.repo.ListVendorsWithDetails(ctx, id)

	resp := s.mapCategoryToResponse(category)
	resp.Attributes = s.mapAttributesToResponse(attrs)
	resp.Vendors = s.mapVendorsToResponse(vendors)
	return resp, http.StatusOK, nil
}

func (s *service) UpdateCategory(ctx context.Context, id int, req UpdateCategoryRequest) (CategoryResponse, int, error) {
	if err := validator.ValidateStruct(req); err != nil {
		return CategoryResponse{}, http.StatusBadRequest, err
	}

	category, err := s.repo.GetCategoryByID(ctx, id)
	if err != nil {
		if err == ErrCategoryNotFound {
			return CategoryResponse{}, http.StatusNotFound, err
		}
		return CategoryResponse{}, http.StatusInternalServerError, err
	}

	if req.Name != "" {
		category.Name = req.Name
	}

	if err := s.repo.UpdateCategory(ctx, category); err != nil {
		return CategoryResponse{}, http.StatusInternalServerError, err
	}

	return s.mapCategoryToResponse(category), http.StatusOK, nil
}

func (s *service) DeleteCategory(ctx context.Context, id int) (int, error) {
	if _, err := s.repo.GetCategoryByID(ctx, id); err != nil {
		if err == ErrCategoryNotFound {
			return http.StatusNotFound, err
		}
		return http.StatusInternalServerError, err
	}

	if err := s.repo.DeleteCategory(ctx, id); err != nil {
		return http.StatusInternalServerError, err
	}

	return http.StatusOK, nil
}

func (s *service) SelectVendor(ctx context.Context, categoryID int, vendorID string) (SelectVendorResponse, int, error) {
	if _, err := s.repo.GetCategoryByID(ctx, categoryID); err != nil {
		if err == ErrCategoryNotFound {
			return SelectVendorResponse{}, http.StatusNotFound, err
		}
		return SelectVendorResponse{}, http.StatusInternalServerError, err
	}

	if _, err := s.repo.GetVendorByID(ctx, vendorID); err != nil {
		if err == ErrVendorNotFound {
			return SelectVendorResponse{}, http.StatusNotFound, err
		}
		return SelectVendorResponse{}, http.StatusInternalServerError, err
	}

	if err := s.repo.SelectVendor(ctx, categoryID, &vendorID); err != nil {
		return SelectVendorResponse{}, http.StatusInternalServerError, err
	}

	return SelectVendorResponse{
		CategoryID:       categoryID,
		SelectedVendorID: &vendorID,
	}, http.StatusOK, nil
}

func (s *service) DeselectVendor(ctx context.Context, categoryID int) (SelectVendorResponse, int, error) {
	if _, err := s.repo.GetCategoryByID(ctx, categoryID); err != nil {
		if err == ErrCategoryNotFound {
			return SelectVendorResponse{}, http.StatusNotFound, err
		}
		return SelectVendorResponse{}, http.StatusInternalServerError, err
	}

	if err := s.repo.SelectVendor(ctx, categoryID, nil); err != nil {
		return SelectVendorResponse{}, http.StatusInternalServerError, err
	}

	return SelectVendorResponse{
		CategoryID:       categoryID,
		SelectedVendorID: nil,
	}, http.StatusOK, nil
}

// --- Attribute Service ---

func (s *service) CreateAttribute(ctx context.Context, categoryID int, req CreateAttributeRequest) (AttributeResponse, int, error) {
	if err := validator.ValidateStruct(req); err != nil {
		return AttributeResponse{}, http.StatusBadRequest, err
	}

	if _, err := s.repo.GetCategoryByID(ctx, categoryID); err != nil {
		if err == ErrCategoryNotFound {
			return AttributeResponse{}, http.StatusNotFound, err
		}
		return AttributeResponse{}, http.StatusInternalServerError, err
	}

	attr := &models.VendorCategoryAttribute{
		CategoryID: categoryID,
		Name:       req.Name,
		SortOrder:  req.SortOrder,
	}

	if err := s.repo.CreateAttribute(ctx, attr); err != nil {
		return AttributeResponse{}, http.StatusInternalServerError, err
	}

	return s.mapAttributeToResponse(attr), http.StatusCreated, nil
}

func (s *service) ListAttributes(ctx context.Context, categoryID int) ([]AttributeResponse, int, error) {
	attrs, err := s.repo.ListAttributes(ctx, categoryID)
	if err != nil {
		return nil, http.StatusInternalServerError, err
	}

	return s.mapAttributesToResponse(attrs), http.StatusOK, nil
}

func (s *service) UpdateAttribute(ctx context.Context, id int, req UpdateAttributeRequest) (AttributeResponse, int, error) {
	if err := validator.ValidateStruct(req); err != nil {
		return AttributeResponse{}, http.StatusBadRequest, err
	}

	attr, err := s.repo.GetAttributeByID(ctx, id)
	if err != nil {
		if err == ErrAttributeNotFound {
			return AttributeResponse{}, http.StatusNotFound, err
		}
		return AttributeResponse{}, http.StatusInternalServerError, err
	}

	if req.Name != "" {
		attr.Name = req.Name
	}
	if req.SortOrder != nil {
		attr.SortOrder = *req.SortOrder
	}

	if err := s.repo.UpdateAttribute(ctx, attr); err != nil {
		return AttributeResponse{}, http.StatusInternalServerError, err
	}

	return s.mapAttributeToResponse(attr), http.StatusOK, nil
}

func (s *service) DeleteAttribute(ctx context.Context, id int) (int, error) {
	if _, err := s.repo.GetAttributeByID(ctx, id); err != nil {
		if err == ErrAttributeNotFound {
			return http.StatusNotFound, err
		}
		return http.StatusInternalServerError, err
	}

	if err := s.repo.DeleteAttribute(ctx, id); err != nil {
		return http.StatusInternalServerError, err
	}

	return http.StatusOK, nil
}

// --- Vendor Service ---

func (s *service) CreateVendor(ctx context.Context, categoryID int, req CreateVendorRequest) (VendorResponse, int, error) {
	if err := validator.ValidateStruct(req); err != nil {
		return VendorResponse{}, http.StatusBadRequest, err
	}

	if _, err := s.repo.GetCategoryByID(ctx, categoryID); err != nil {
		if err == ErrCategoryNotFound {
			return VendorResponse{}, http.StatusNotFound, err
		}
		return VendorResponse{}, http.StatusInternalServerError, err
	}

	paymentStatus := req.PaymentStatus
	if paymentStatus == "" {
		paymentStatus = "unpaid"
	}

	vendor := &models.Vendor{
		CategoryID:     categoryID,
		Name:           req.Name,
		ContactPerson:  req.ContactPerson,
		PhoneNumber:    req.PhoneNumber,
		Instagram:      req.Instagram,
		Address:        req.Address,
		ReferencePrice: req.ReferencePrice,
		ContractAmount: req.ContractAmount,
		PaymentStatus:  paymentStatus,
		Note:           req.Note,
	}

	if err := s.repo.CreateVendor(ctx, vendor); err != nil {
		return VendorResponse{}, http.StatusInternalServerError, err
	}

	// Save attribute values if provided
	if req.AttributeValues != nil {
		for attrID, val := range req.AttributeValues {
			av := &models.VendorAttributeValue{
				VendorID:    vendor.ID,
				AttributeID: attrID,
				Value:       val,
			}
			if err := s.repo.UpsertAttributeValue(ctx, av); err != nil {
				return VendorResponse{}, http.StatusInternalServerError, err
			}
		}
	}

	// Fetch full vendor with details
	fullVendor, _ := s.repo.GetVendorByID(ctx, vendor.ID)
	return s.mapVendorToResponse(*fullVendor), http.StatusCreated, nil
}

func (s *service) GetVendorByID(ctx context.Context, id string) (VendorResponse, int, error) {
	vendor, err := s.repo.GetVendorByID(ctx, id)
	if err != nil {
		if err == ErrVendorNotFound {
			return VendorResponse{}, http.StatusNotFound, err
		}
		return VendorResponse{}, http.StatusInternalServerError, err
	}

	return s.mapVendorToResponse(*vendor), http.StatusOK, nil
}

func (s *service) ListVendors(ctx context.Context, categoryID int) ([]VendorResponse, int, error) {
	vendors, err := s.repo.ListVendorsWithDetails(ctx, categoryID)
	if err != nil {
		return nil, http.StatusInternalServerError, err
	}

	return s.mapVendorsToResponse(vendors), http.StatusOK, nil
}

func (s *service) UpdateVendor(ctx context.Context, id string, req UpdateVendorRequest) (VendorResponse, int, error) {
	if err := validator.ValidateStruct(req); err != nil {
		return VendorResponse{}, http.StatusBadRequest, err
	}

	vendor, err := s.repo.GetVendorByID(ctx, id)
	if err != nil {
		if err == ErrVendorNotFound {
			return VendorResponse{}, http.StatusNotFound, err
		}
		return VendorResponse{}, http.StatusInternalServerError, err
	}

	if req.Name != nil {
		vendor.Name = *req.Name
	}
	if req.ContactPerson != nil {
		vendor.ContactPerson = req.ContactPerson
	}
	if req.PhoneNumber != nil {
		vendor.PhoneNumber = req.PhoneNumber
	}
	if req.Instagram != nil {
		vendor.Instagram = req.Instagram
	}
	if req.Address != nil {
		vendor.Address = req.Address
	}
	if req.ReferencePrice != nil {
		vendor.ReferencePrice = req.ReferencePrice
	}
	if req.ContractAmount != nil {
		vendor.ContractAmount = req.ContractAmount
	}
	if req.PaymentStatus != nil {
		vendor.PaymentStatus = *req.PaymentStatus
	}
	if req.Note != nil {
		vendor.Note = req.Note
	}

	if err := s.repo.UpdateVendor(ctx, vendor); err != nil {
		return VendorResponse{}, http.StatusInternalServerError, err
	}

	fullVendor, _ := s.repo.GetVendorByID(ctx, id)
	return s.mapVendorToResponse(*fullVendor), http.StatusOK, nil
}

func (s *service) DeleteVendor(ctx context.Context, id string) (int, error) {
	if _, err := s.repo.GetVendorByID(ctx, id); err != nil {
		if err == ErrVendorNotFound {
			return http.StatusNotFound, err
		}
		return http.StatusInternalServerError, err
	}

	if err := s.repo.DeleteVendor(ctx, id); err != nil {
		return http.StatusInternalServerError, err
	}

	return http.StatusOK, nil
}

// --- Attribute Value Service ---

func (s *service) UpdateAttributeValues(ctx context.Context, vendorID string, req UpdateAttributeValuesRequest) (int, error) {
	if _, err := s.repo.GetVendorByID(ctx, vendorID); err != nil {
		if err == ErrVendorNotFound {
			return http.StatusNotFound, err
		}
		return http.StatusInternalServerError, err
	}

	for attrID, val := range req.Values {
		av := &models.VendorAttributeValue{
			VendorID:    vendorID,
			AttributeID: attrID,
			Value:       val,
		}
		if err := s.repo.UpsertAttributeValue(ctx, av); err != nil {
			return http.StatusInternalServerError, err
		}
	}

	return http.StatusOK, nil
}

// --- Payment Service ---

func (s *service) CreatePayment(ctx context.Context, vendorID string, req CreatePaymentRequest) (PaymentResponse, int, error) {
	if err := validator.ValidateStruct(req); err != nil {
		return PaymentResponse{}, http.StatusBadRequest, err
	}

	if _, err := s.repo.GetVendorByID(ctx, vendorID); err != nil {
		if err == ErrVendorNotFound {
			return PaymentResponse{}, http.StatusNotFound, err
		}
		return PaymentResponse{}, http.StatusInternalServerError, err
	}

	date, err := time.Parse("2006-01-02", req.Date)
	if err != nil {
		return PaymentResponse{}, http.StatusBadRequest, err
	}

	payment := &models.VendorPayment{
		VendorID: vendorID,
		Date:     date,
		Amount:   req.Amount,
		Note:     req.Note,
	}

	if err := s.repo.CreatePayment(ctx, payment); err != nil {
		return PaymentResponse{}, http.StatusInternalServerError, err
	}

	return s.mapPaymentToResponse(payment), http.StatusCreated, nil
}

func (s *service) ListPayments(ctx context.Context, vendorID string) ([]PaymentResponse, int, error) {
	payments, err := s.repo.ListPayments(ctx, vendorID)
	if err != nil {
		return nil, http.StatusInternalServerError, err
	}

	return s.mapPaymentsToResponse(payments), http.StatusOK, nil
}

func (s *service) UpdatePayment(ctx context.Context, id int, req UpdatePaymentRequest) (PaymentResponse, int, error) {
	payment, err := s.repo.GetPaymentByID(ctx, id)
	if err != nil {
		if err == ErrPaymentNotFound {
			return PaymentResponse{}, http.StatusNotFound, err
		}
		return PaymentResponse{}, http.StatusInternalServerError, err
	}

	if req.Date != "" {
		date, err := time.Parse("2006-01-02", req.Date)
		if err != nil {
			return PaymentResponse{}, http.StatusBadRequest, err
		}
		payment.Date = date
	}
	if req.Amount != nil {
		payment.Amount = *req.Amount
	}
	if req.Note != nil {
		payment.Note = req.Note
	}

	if err := s.repo.UpdatePayment(ctx, payment); err != nil {
		return PaymentResponse{}, http.StatusInternalServerError, err
	}

	return s.mapPaymentToResponse(payment), http.StatusOK, nil
}

func (s *service) DeletePayment(ctx context.Context, id int) (int, error) {
	if _, err := s.repo.GetPaymentByID(ctx, id); err != nil {
		if err == ErrPaymentNotFound {
			return http.StatusNotFound, err
		}
		return http.StatusInternalServerError, err
	}

	if err := s.repo.DeletePayment(ctx, id); err != nil {
		return http.StatusInternalServerError, err
	}

	return http.StatusOK, nil
}

// --- Overview ---

func (s *service) GetOverview(ctx context.Context, eventID string) (OverviewResponse, int, error) {
	categories, err := s.repo.GetAllCategoriesWithDetails(ctx, eventID)
	if err != nil {
		return OverviewResponse{}, http.StatusInternalServerError, err
	}

	items := make([]CategoryResponse, len(categories))
	for i, c := range categories {
		resp := s.mapCategoryToResponse(&c)
		resp.Attributes = s.mapAttributesToResponse(c.Attributes)
		resp.Vendors = s.mapVendorsToResponse(c.Vendors)
		items[i] = resp
	}

	return OverviewResponse{Categories: items}, http.StatusOK, nil
}

// --- Mappers ---

func (s *service) mapCategoryToResponse(c *models.VendorCategory) CategoryResponse {
	return CategoryResponse{
		ID:               c.ID,
		EventID:          c.EventID,
		Name:             c.Name,
		SelectedVendorID: c.SelectedVendorID,
		CreatedAt:        c.CreatedAt,
		UpdatedAt:        c.UpdatedAt,
	}
}

func (s *service) mapAttributeToResponse(a *models.VendorCategoryAttribute) AttributeResponse {
	return AttributeResponse{
		ID:         a.ID,
		CategoryID: a.CategoryID,
		Name:       a.Name,
		SortOrder:  a.SortOrder,
		CreatedAt:  a.CreatedAt,
		UpdatedAt:  a.UpdatedAt,
	}
}

func (s *service) mapAttributesToResponse(attrs []models.VendorCategoryAttribute) []AttributeResponse {
	items := make([]AttributeResponse, len(attrs))
	for i, a := range attrs {
		items[i] = s.mapAttributeToResponse(&a)
	}
	return items
}

func (s *service) mapVendorToResponse(v models.Vendor) VendorResponse {
	resp := VendorResponse{
		ID:             v.ID,
		CategoryID:     v.CategoryID,
		Name:           v.Name,
		ContactPerson:  v.ContactPerson,
		PhoneNumber:    v.PhoneNumber,
		Instagram:      v.Instagram,
		Address:        v.Address,
		ReferencePrice: v.ReferencePrice,
		ContractAmount: v.ContractAmount,
		PaymentStatus:  v.PaymentStatus,
		Note:           v.Note,
		CreatedAt:      v.CreatedAt,
		UpdatedAt:      v.UpdatedAt,
	}

	resp.AttributeValues = make([]AttributeValueResponse, len(v.AttributeValues))
	for i, av := range v.AttributeValues {
		resp.AttributeValues[i] = AttributeValueResponse{
			ID:          av.ID,
			VendorID:    av.VendorID,
			AttributeID: av.AttributeID,
			Value:       av.Value,
		}
	}

	if resp.AttributeValues == nil {
		resp.AttributeValues = []AttributeValueResponse{}
	}

	resp.Payments = s.mapPaymentsToResponse(v.Payments)
	return resp
}

func (s *service) mapVendorsToResponse(vendors []models.Vendor) []VendorResponse {
	items := make([]VendorResponse, len(vendors))
	for i, v := range vendors {
		items[i] = s.mapVendorToResponse(v)
	}
	return items
}

func (s *service) mapPaymentToResponse(p *models.VendorPayment) PaymentResponse {
	return PaymentResponse{
		ID:        p.ID,
		VendorID:  p.VendorID,
		Date:      p.Date.Format("2006-01-02"),
		Amount:    p.Amount,
		Note:      p.Note,
		CreatedAt: p.CreatedAt,
		UpdatedAt: p.UpdatedAt,
	}
}

func (s *service) mapPaymentsToResponse(payments []models.VendorPayment) []PaymentResponse {
	if payments == nil {
		return []PaymentResponse{}
	}
	items := make([]PaymentResponse, len(payments))
	for i, p := range payments {
		items[i] = s.mapPaymentToResponse(&p)
	}
	return items
}

func getTotalPages(total int64, pageSize int) int {
	return int(math.Ceil(float64(total) / float64(pageSize)))
}
