package guest

import (
	"time"
)

type CreateCategoryRequest struct {
	Name      string     `json:"name" validate:"required,min=2,max=100"`
	StartTime *time.Time `json:"start_time"`
	EndTime   *time.Time `json:"end_time"`
}

type UpdateCategoryRequest struct {
	Name      string     `json:"name" validate:"omitempty,min=2,max=100"`
	StartTime *time.Time `json:"start_time"`
	EndTime   *time.Time `json:"end_time"`
}

type CategoryResponse struct {
	ID        int        `json:"id"`
	Name      string     `json:"name"`
	StartTime *time.Time `json:"start_time"`
	EndTime   *time.Time `json:"end_time"`
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt time.Time  `json:"updated_at"`
}

type CategoryListRequest struct {
	Page     int    `json:"page"`
	PageSize int    `json:"page_size"`
	Search   string `json:"search"`
}

type CategoryListResponse struct {
	Items      []CategoryResponse `json:"items"`
	Total      int64              `json:"total"`
	Page       int                `json:"page"`
	PageSize   int                `json:"page_size"`
	TotalPages int                `json:"total_pages"`
}
