package vendor

import (
	"context"
	"errors"
	"time"

	"github.com/base-go/backend/internal/shared/models"
	"github.com/base-go/backend/pkg/database"
	"gorm.io/gorm"
)

var (
	ErrCategoryNotFound      = errors.New("vendor category not found")
	ErrCategoryAlreadyExists = errors.New("vendor category already exists")
	ErrAttributeNotFound     = errors.New("attribute not found")
	ErrVendorNotFound        = errors.New("vendor not found")
	ErrPaymentNotFound       = errors.New("payment not found")
)

type Repository interface {
	// Category operations
	CreateCategory(ctx context.Context, category *models.VendorCategory) error
	GetCategoryByID(ctx context.Context, id int) (*models.VendorCategory, error)
	ListCategories(ctx context.Context, eventID string) ([]models.VendorCategory, error)
	UpdateCategory(ctx context.Context, category *models.VendorCategory) error
	DeleteCategory(ctx context.Context, id int) error
	SelectVendor(ctx context.Context, categoryID int, vendorID *string) error

	// Attribute operations
	CreateAttribute(ctx context.Context, attr *models.VendorCategoryAttribute) error
	GetAttributeByID(ctx context.Context, id int) (*models.VendorCategoryAttribute, error)
	ListAttributes(ctx context.Context, categoryID int) ([]models.VendorCategoryAttribute, error)
	UpdateAttribute(ctx context.Context, attr *models.VendorCategoryAttribute) error
	DeleteAttribute(ctx context.Context, id int) error

	// Vendor operations
	CreateVendor(ctx context.Context, vendor *models.Vendor) error
	GetVendorByID(ctx context.Context, id string) (*models.Vendor, error)
	ListVendors(ctx context.Context, categoryID int) ([]models.Vendor, error)
	ListVendorsWithDetails(ctx context.Context, categoryID int) ([]models.Vendor, error)
	UpdateVendor(ctx context.Context, vendor *models.Vendor) error
	DeleteVendor(ctx context.Context, id string) error

	// Attribute Value operations
	UpsertAttributeValue(ctx context.Context, value *models.VendorAttributeValue) error
	DeleteAttributeValuesByVendor(ctx context.Context, vendorID string) error

	// Payment operations
	CreatePayment(ctx context.Context, payment *models.VendorPayment) error
	GetPaymentByID(ctx context.Context, id int) (*models.VendorPayment, error)
	ListPayments(ctx context.Context, vendorID string) ([]models.VendorPayment, error)
	UpdatePayment(ctx context.Context, payment *models.VendorPayment) error
	DeletePayment(ctx context.Context, id int) error

	// Overview
	GetAllCategoriesWithDetails(ctx context.Context, eventID string) ([]models.VendorCategory, error)
}

type repository struct {
	db database.Database
}

func NewRepository(db database.Database) Repository {
	return &repository{db: db}
}

// --- Category Operations ---

func (r *repository) CreateCategory(ctx context.Context, category *models.VendorCategory) error {
	var existing models.VendorCategory
	if err := r.db.GetDB().Where("event_id = ? AND name = ?", category.EventID, category.Name).First(&existing).Error; err == nil {
		return ErrCategoryAlreadyExists
	}
	return r.db.GetDB().WithContext(ctx).Create(category).Error
}

func (r *repository) GetCategoryByID(ctx context.Context, id int) (*models.VendorCategory, error) {
	var category models.VendorCategory
	err := r.db.GetDB().WithContext(ctx).
		Preload("SelectedVendor").
		Where("id = ?", id).
		First(&category).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrCategoryNotFound
		}
		return nil, err
	}
	return &category, nil
}

func (r *repository) ListCategories(ctx context.Context, eventID string) ([]models.VendorCategory, error) {
	var categories []models.VendorCategory
	err := r.db.GetDB().WithContext(ctx).
		Preload("SelectedVendor").
		Where("event_id = ?", eventID).
		Order("created_at asc").
		Find(&categories).Error
	return categories, err
}

func (r *repository) UpdateCategory(ctx context.Context, category *models.VendorCategory) error {
	return r.db.GetDB().WithContext(ctx).Save(category).Error
}

func (r *repository) DeleteCategory(ctx context.Context, id int) error {
	return r.db.GetDB().WithContext(ctx).Delete(&models.VendorCategory{}, id).Error
}

func (r *repository) SelectVendor(ctx context.Context, categoryID int, vendorID *string) error {
	return r.db.GetDB().WithContext(ctx).
		Model(&models.VendorCategory{}).
		Where("id = ?", categoryID).
		Update("selected_vendor_id", vendorID).Error
}

// --- Attribute Operations ---

func (r *repository) CreateAttribute(ctx context.Context, attr *models.VendorCategoryAttribute) error {
	return r.db.GetDB().WithContext(ctx).Create(attr).Error
}

func (r *repository) GetAttributeByID(ctx context.Context, id int) (*models.VendorCategoryAttribute, error) {
	var attr models.VendorCategoryAttribute
	err := r.db.GetDB().WithContext(ctx).Where("id = ?", id).First(&attr).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrAttributeNotFound
		}
		return nil, err
	}
	return &attr, nil
}

func (r *repository) ListAttributes(ctx context.Context, categoryID int) ([]models.VendorCategoryAttribute, error) {
	var attrs []models.VendorCategoryAttribute
	err := r.db.GetDB().WithContext(ctx).
		Where("category_id = ?", categoryID).
		Order("sort_order asc, id asc").
		Find(&attrs).Error
	return attrs, err
}

func (r *repository) UpdateAttribute(ctx context.Context, attr *models.VendorCategoryAttribute) error {
	return r.db.GetDB().WithContext(ctx).Save(attr).Error
}

func (r *repository) DeleteAttribute(ctx context.Context, id int) error {
	return r.db.GetDB().WithContext(ctx).Delete(&models.VendorCategoryAttribute{}, id).Error
}

// --- Vendor Operations ---

func (r *repository) CreateVendor(ctx context.Context, vendor *models.Vendor) error {
	return r.db.GetDB().WithContext(ctx).Create(vendor).Error
}

func (r *repository) GetVendorByID(ctx context.Context, id string) (*models.Vendor, error) {
	var vendor models.Vendor
	err := r.db.GetDB().WithContext(ctx).
		Preload("AttributeValues").
		Preload("Payments").
		Where("id = ? AND deleted_at IS NULL", id).
		First(&vendor).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrVendorNotFound
		}
		return nil, err
	}
	return &vendor, nil
}

func (r *repository) ListVendors(ctx context.Context, categoryID int) ([]models.Vendor, error) {
	var vendors []models.Vendor
	err := r.db.GetDB().WithContext(ctx).
		Where("category_id = ? AND deleted_at IS NULL", categoryID).
		Order("created_at asc").
		Find(&vendors).Error
	return vendors, err
}

func (r *repository) ListVendorsWithDetails(ctx context.Context, categoryID int) ([]models.Vendor, error) {
	var vendors []models.Vendor
	err := r.db.GetDB().WithContext(ctx).
		Preload("AttributeValues").
		Preload("Payments").
		Where("category_id = ? AND deleted_at IS NULL", categoryID).
		Order("created_at asc").
		Find(&vendors).Error
	return vendors, err
}

func (r *repository) UpdateVendor(ctx context.Context, vendor *models.Vendor) error {
	return r.db.GetDB().WithContext(ctx).Save(vendor).Error
}

func (r *repository) DeleteVendor(ctx context.Context, id string) error {
	now := time.Now()
	return r.db.GetDB().WithContext(ctx).
		Model(&models.Vendor{}).
		Where("id = ?", id).
		Update("deleted_at", now).Error
}

// --- Attribute Value Operations ---

func (r *repository) UpsertAttributeValue(ctx context.Context, value *models.VendorAttributeValue) error {
	var existing models.VendorAttributeValue
	result := r.db.GetDB().WithContext(ctx).
		Where("vendor_id = ? AND attribute_id = ?", value.VendorID, value.AttributeID).
		First(&existing)

	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return r.db.GetDB().WithContext(ctx).Create(value).Error
		}
		return result.Error
	}

	existing.Value = value.Value
	return r.db.GetDB().WithContext(ctx).Save(&existing).Error
}

func (r *repository) DeleteAttributeValuesByVendor(ctx context.Context, vendorID string) error {
	return r.db.GetDB().WithContext(ctx).
		Where("vendor_id = ?", vendorID).
		Delete(&models.VendorAttributeValue{}).Error
}

// --- Payment Operations ---

func (r *repository) CreatePayment(ctx context.Context, payment *models.VendorPayment) error {
	return r.db.GetDB().WithContext(ctx).Create(payment).Error
}

func (r *repository) GetPaymentByID(ctx context.Context, id int) (*models.VendorPayment, error) {
	var payment models.VendorPayment
	err := r.db.GetDB().WithContext(ctx).Where("id = ?", id).First(&payment).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrPaymentNotFound
		}
		return nil, err
	}
	return &payment, nil
}

func (r *repository) ListPayments(ctx context.Context, vendorID string) ([]models.VendorPayment, error) {
	var payments []models.VendorPayment
	err := r.db.GetDB().WithContext(ctx).
		Where("vendor_id = ?", vendorID).
		Order("date asc").
		Find(&payments).Error
	return payments, err
}

func (r *repository) UpdatePayment(ctx context.Context, payment *models.VendorPayment) error {
	return r.db.GetDB().WithContext(ctx).Save(payment).Error
}

func (r *repository) DeletePayment(ctx context.Context, id int) error {
	return r.db.GetDB().WithContext(ctx).Delete(&models.VendorPayment{}, id).Error
}

// --- Overview ---

func (r *repository) GetAllCategoriesWithDetails(ctx context.Context, eventID string) ([]models.VendorCategory, error) {
	var categories []models.VendorCategory
	err := r.db.GetDB().WithContext(ctx).
		Preload("SelectedVendor").
		Preload("Attributes", func(db *gorm.DB) *gorm.DB {
			return db.Order("sort_order asc, id asc")
		}).
		Where("event_id = ?", eventID).
		Order("created_at asc").
		Find(&categories).Error
	if err != nil {
		return nil, err
	}

	// Load vendors for each category
	for i := range categories {
		vendors, err := r.ListVendorsWithDetails(ctx, categories[i].ID)
		if err != nil {
			return nil, err
		}
		categories[i].Vendors = vendors
	}

	return categories, nil
}
