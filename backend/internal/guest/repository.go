package guest

import (
	"context"
	"errors"
	"time"

	"github.com/base-go/backend/internal/shared/models"
	"github.com/base-go/backend/pkg/database"
	"gorm.io/gorm"
)

var (
	ErrGuestNotFound         = errors.New("guest not found")
	ErrCategoryNotFound      = errors.New("guest category not found")
	ErrCategoryAlreadyExists = errors.New("guest category already exists")
)

type Repository interface {
	// Guest operations
	Create(ctx context.Context, guest *models.Guest) error
	GetByID(ctx context.Context, id string) (*models.Guest, error)
	List(ctx context.Context, req GuestListRequest) ([]models.Guest, int64, error)
	Update(ctx context.Context, guest *models.Guest) error
	Delete(ctx context.Context, id string) error
	Restore(ctx context.Context, id string) error
	ListDeleted(ctx context.Context, req GuestListRequest) ([]models.Guest, int64, error)
	IsQRCodeExists(ctx context.Context, qrCode string) (bool, error)
	UpdateStatusSent(ctx context.Context, id string, status string) error
	ListAll(ctx context.Context) ([]models.Guest, error)

	// Guest Category operations
	CreateCategory(ctx context.Context, category *models.GuestCategory) error
	GetCategoryByID(ctx context.Context, id int) (*models.GuestCategory, error)
	GetAllCategories(ctx context.Context, req GuestCategoryListRequest) ([]models.GuestCategory, int64, error)
	ListAllCategories(ctx context.Context) ([]models.GuestCategory, error)
	UpdateCategory(ctx context.Context, category *models.GuestCategory) error
	DeleteCategory(ctx context.Context, id int) error
}

type repository struct {
	db database.Database
}

func NewRepository(db database.Database) Repository {
	return &repository{db: db}
}

// --- Guest Operations ---

func (r *repository) Create(ctx context.Context, guest *models.Guest) error {
	return r.db.GetDB().WithContext(ctx).Create(guest).Error
}

func (r *repository) GetByID(ctx context.Context, id string) (*models.Guest, error) {
	var guest models.Guest
	err := r.db.GetDB().WithContext(ctx).Preload("GuestCategory").
		Where("id = ? AND deleted_at IS NULL", id).
		First(&guest).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrGuestNotFound
		}
		return nil, err
	}
	return &guest, nil
}

func (r *repository) List(ctx context.Context, req GuestListRequest) ([]models.Guest, int64, error) {
	var guests []models.Guest
	var total int64

	query := r.db.GetDB().WithContext(ctx).Model(&models.Guest{}).
		Preload("GuestCategory").
		Where("deleted_at IS NULL")

	if req.Search != "" {
		query = query.Where("name ILIKE ? OR qr_code ILIKE ?", "%"+req.Search+"%", "%"+req.Search+"%")
	}

	if req.CategoryID != 0 {
		query = query.Where("guest_category_id = ?", req.CategoryID)
	}

	if req.StatusAttending != "" {
		query = query.Where("status_attending = ?", req.StatusAttending)
	}

	if req.StatusSent != "" {
		query = query.Where("status_sent = ?", req.StatusSent)
	}

	if req.IsCheckedIn != nil {
		if *req.IsCheckedIn {
			query = query.Where("check_in_at IS NOT NULL")
		} else {
			query = query.Where("check_in_at IS NULL")
		}
	}

	err := query.Count(&total).Error
	if err != nil {
		return nil, 0, err
	}

	// Sorting logic
	sortDir := "DESC"
	if req.SortDir != "" {
		sortDir = req.SortDir
	}

	sortBy := "created_at"
	if req.SortBy == "name" {
		sortBy = "name"
	}

	offset := (req.Page - 1) * req.PageSize
	err = query.Offset(offset).Limit(req.PageSize).Order(sortBy + " " + sortDir).Find(&guests).Error

	return guests, total, err
}

func (r *repository) Update(ctx context.Context, guest *models.Guest) error {
	return r.db.GetDB().WithContext(ctx).Save(guest).Error
}

func (r *repository) Delete(ctx context.Context, id string) error {
	now := time.Now()
	return r.db.GetDB().WithContext(ctx).
		Model(&models.Guest{}).
		Where("id = ?", id).
		Update("deleted_at", now).Error
}

func (r *repository) Restore(ctx context.Context, id string) error {
	return r.db.GetDB().WithContext(ctx).
		Model(&models.Guest{}).
		Where("id = ? AND deleted_at IS NOT NULL", id).
		Update("deleted_at", nil).Error
}

func (r *repository) ListDeleted(ctx context.Context, req GuestListRequest) ([]models.Guest, int64, error) {
	var guests []models.Guest
	var total int64

	query := r.db.GetDB().WithContext(ctx).Model(&models.Guest{}).
		Preload("GuestCategory").
		Where("deleted_at IS NOT NULL")

	if req.Search != "" {
		query = query.Where("name ILIKE ? OR qr_code ILIKE ?", "%"+req.Search+"%", "%"+req.Search+"%")
	}

	err := query.Count(&total).Error
	if err != nil {
		return nil, 0, err
	}

	offset := (req.Page - 1) * req.PageSize
	err = query.Offset(offset).Limit(req.PageSize).Order("deleted_at DESC").Find(&guests).Error

	return guests, total, err
}

func (r *repository) IsQRCodeExists(ctx context.Context, qrCode string) (bool, error) {
	var count int64
	err := r.db.GetDB().WithContext(ctx).Model(&models.Guest{}).Where("qr_code = ?", qrCode).Count(&count).Error
	return count > 0, err
}

func (r *repository) ListAll(ctx context.Context) ([]models.Guest, error) {
	var guests []models.Guest
	if err := r.db.GetDB().WithContext(ctx).Preload("GuestCategory").Order("name asc").Find(&guests).Error; err != nil {
		return nil, err
	}
	return guests, nil
}

// --- Guest Category Operations ---

func (r *repository) UpdateStatusSent(ctx context.Context, id string, status string) error {
	if err := r.db.GetDB().WithContext(ctx).Model(&models.Guest{}).Where("id = ?", id).Update("status_sent", status).Error; err != nil {
		return err
	}
	return nil
}

func (r *repository) CreateCategory(ctx context.Context, category *models.GuestCategory) error {
	var existing models.GuestCategory
	if err := r.db.GetDB().Where("name = ?", category.Name).First(&existing).Error; err == nil {
		return ErrCategoryAlreadyExists
	}

	if err := r.db.GetDB().WithContext(ctx).Create(category).Error; err != nil {
		return err
	}
	return nil
}

func (r *repository) GetCategoryByID(ctx context.Context, id int) (*models.GuestCategory, error) {
	var category models.GuestCategory
	if err := r.db.GetDB().WithContext(ctx).Where("id = ?", id).First(&category).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrCategoryNotFound
		}
		return nil, err
	}
	return &category, nil
}

func (r *repository) GetAllCategories(ctx context.Context, req GuestCategoryListRequest) ([]models.GuestCategory, int64, error) {
	var categories []models.GuestCategory
	var total int64

	query := r.db.GetDB().Model(&models.GuestCategory{})

	if req.Search != "" {
		query = query.Where("name ILIKE ?", "%"+req.Search+"%")
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (req.Page - 1) * req.PageSize
	if err := query.Offset(offset).Limit(req.PageSize).Order("created_at desc").Find(&categories).Error; err != nil {
		return nil, 0, err
	}

	return categories, total, nil
}

func (r *repository) UpdateCategory(ctx context.Context, category *models.GuestCategory) error {
	if err := r.db.GetDB().WithContext(ctx).Save(category).Error; err != nil {
		return err
	}
	return nil
}

func (r *repository) DeleteCategory(ctx context.Context, id int) error {
	if err := r.db.GetDB().WithContext(ctx).Delete(&models.GuestCategory{}, id).Error; err != nil {
		return err
	}
	return nil
}
func (r *repository) ListAllCategories(ctx context.Context) ([]models.GuestCategory, error) {
	var categories []models.GuestCategory
	if err := r.db.GetDB().WithContext(ctx).Order("name asc").Find(&categories).Error; err != nil {
		return nil, err
	}
	return categories, nil
}
