package guest

import (
	"context"
	"errors"

	"github.com/base-go/backend/internal/shared/models"
	"github.com/base-go/backend/pkg/database"
	"gorm.io/gorm"
)

var (
	ErrCategoryNotFound      = errors.New("guest category not found")
	ErrCategoryAlreadyExists = errors.New("guest category already exists")
)

type Repository interface {
	CreateCategory(ctx context.Context, category *models.GuestCategory) error
	GetCategoryByID(ctx context.Context, id int) (*models.GuestCategory, error)
	GetAllCategories(ctx context.Context, req CategoryListRequest) ([]models.GuestCategory, int64, error)
	UpdateCategory(ctx context.Context, category *models.GuestCategory) error
	DeleteCategory(ctx context.Context, id int) error
}

type repository struct {
	db database.Database
}

func NewRepository(db database.Database) Repository {
	return &repository{
		db: db,
	}
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

func (r *repository) GetAllCategories(ctx context.Context, req CategoryListRequest) ([]models.GuestCategory, int64, error) {
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
