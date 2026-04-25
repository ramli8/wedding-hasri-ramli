package guest

import (
	"context"
	"net/http"

	"github.com/base-go/backend/internal/shared/models"
	"github.com/base-go/backend/pkg/validator"
)

type Service interface {
	CreateCategory(ctx context.Context, req CreateCategoryRequest) (*CategoryResponse, int, error)
	GetCategoryByID(ctx context.Context, id int) (*CategoryResponse, int, error)
	ListCategories(ctx context.Context, req CategoryListRequest) (*CategoryListResponse, int, error)
	UpdateCategory(ctx context.Context, id int, req UpdateCategoryRequest) (*CategoryResponse, int, error)
	DeleteCategory(ctx context.Context, id int) (int, error)
}

type service struct {
	repo Repository
}

func NewService(repo Repository) Service {
	return &service{
		repo: repo,
	}
}

func (s *service) CreateCategory(ctx context.Context, req CreateCategoryRequest) (*CategoryResponse, int, error) {
	if err := validator.ValidateStruct(req); err != nil {
		return nil, http.StatusBadRequest, err
	}

	category := &models.GuestCategory{
		Name:      req.Name,
		StartTime: req.StartTime,
		EndTime:   req.EndTime,
	}

	if err := s.repo.CreateCategory(ctx, category); err != nil {
		if err == ErrCategoryAlreadyExists {
			return nil, http.StatusConflict, err
		}
		return nil, http.StatusInternalServerError, err
	}

	return s.mapCategoryToResponse(category), http.StatusCreated, nil
}

func (s *service) GetCategoryByID(ctx context.Context, id int) (*CategoryResponse, int, error) {
	category, err := s.repo.GetCategoryByID(ctx, id)
	if err != nil {
		if err == ErrCategoryNotFound {
			return nil, http.StatusNotFound, err
		}
		return nil, http.StatusInternalServerError, err
	}

	return s.mapCategoryToResponse(category), http.StatusOK, nil
}

func (s *service) ListCategories(ctx context.Context, req CategoryListRequest) (*CategoryListResponse, int, error) {
	if req.Page < 1 {
		req.Page = 1
	}
	if req.PageSize < 1 || req.PageSize > 100 {
		req.PageSize = 10
	}

	categories, total, err := s.repo.GetAllCategories(ctx, req)
	if err != nil {
		return nil, http.StatusInternalServerError, err
	}

	items := make([]CategoryResponse, len(categories))
	for i, category := range categories {
		items[i] = *s.mapCategoryToResponse(&category)
	}

	totalPages := int(total) / req.PageSize
	if int(total)%req.PageSize > 0 {
		totalPages++
	}

	return &CategoryListResponse{
		Items:      items,
		Total:      total,
		Page:       req.Page,
		PageSize:   req.PageSize,
		TotalPages: totalPages,
	}, http.StatusOK, nil
}

func (s *service) UpdateCategory(ctx context.Context, id int, req UpdateCategoryRequest) (*CategoryResponse, int, error) {
	if err := validator.ValidateStruct(req); err != nil {
		return nil, http.StatusBadRequest, err
	}

	category, err := s.repo.GetCategoryByID(ctx, id)
	if err != nil {
		if err == ErrCategoryNotFound {
			return nil, http.StatusNotFound, err
		}
		return nil, http.StatusInternalServerError, err
	}

	if req.Name != "" {
		category.Name = req.Name
	}

	// For nullable fields, we always update if provided in the struct
	category.StartTime = req.StartTime
	category.EndTime = req.EndTime

	if err := s.repo.UpdateCategory(ctx, category); err != nil {
		return nil, http.StatusInternalServerError, err
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

func (s *service) mapCategoryToResponse(category *models.GuestCategory) *CategoryResponse {
	return &CategoryResponse{
		ID:        category.ID,
		Name:      category.Name,
		StartTime: category.StartTime,
		EndTime:   category.EndTime,
		CreatedAt: category.CreatedAt,
		UpdatedAt: category.UpdatedAt,
	}
}
