package guest

import (
	"time"
)

// Guest Category DTOs
type CreateGuestCategoryRequest struct {
	Name      string     `json:"name" validate:"required,min=2,max=100"`
	StartTime *time.Time `json:"start_time"`
	EndTime   *time.Time `json:"end_time"`
}

type UpdateGuestCategoryRequest struct {
	Name      string     `json:"name" validate:"omitempty,min=2,max=100"`
	StartTime *time.Time `json:"start_time"`
	EndTime   *time.Time `json:"end_time"`
}

type GuestCategoryResponse struct {
	ID        int        `json:"id"`
	Name      string     `json:"name"`
	StartTime *time.Time `json:"start_time"`
	EndTime   *time.Time `json:"end_time"`
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt time.Time  `json:"updated_at"`
}

type GuestCategoryListRequest struct {
	Page     int    `json:"page"`
	PageSize int    `json:"page_size"`
	Search   string `json:"search"`
}

type GuestCategoryListResponse struct {
	Items      []GuestCategoryResponse `json:"items"`
	Total      int64                   `json:"total"`
	Page       int                     `json:"page"`
	PageSize   int                     `json:"page_size"`
	TotalPages int                     `json:"total_pages"`
}

// Guest DTOs
type CreateGuestRequest struct {
	GuestCategoryID   int     `json:"guest_category_id" validate:"required"`
	Name              string  `json:"name" validate:"required,min=2,max=255"`
	PhoneNumber       *string `json:"phone_number" validate:"omitempty,max=20"`
	InstagramUsername *string `json:"instagram_username" validate:"omitempty,max=50"`
	Address           *string `json:"address"`
	Note              *string `json:"note"`
}

type UpdateGuestRequest struct {
	GuestCategoryID   int     `json:"guest_category_id" validate:"omitempty"`
	Name              string  `json:"name" validate:"omitempty,min=2,max=255"`
	PhoneNumber       *string `json:"phone_number" validate:"omitempty,max=20"`
	InstagramUsername *string `json:"instagram_username" validate:"omitempty,max=50"`
	Address           *string `json:"address"`
	Note              *string `json:"note"`
}

type GuestResponse struct {
	ID                string     `json:"id"`
	GuestCategoryID   int        `json:"guest_category_id"`
	CategoryName      string     `json:"category_name"`
	QRCode            string     `json:"qr_code"`
	Name              string     `json:"name"`
	PhoneNumber       *string    `json:"phone_number"`
	InstagramUsername *string    `json:"instagram_username"`
	Address           *string    `json:"address"`
	Note              *string    `json:"note"`
	StatusAttending   string     `json:"status_attending"`
	StatusSent        string     `json:"status_sent"`
	CheckInAt         *time.Time `json:"check_in_at"`
	CheckOutAt        *time.Time `json:"check_out_at"`
	CreatedAt         time.Time  `json:"created_at"`
	UpdatedAt         time.Time  `json:"updated_at"`
}

type GuestListRequest struct {
	Page            int    `json:"page"`
	PageSize        int    `json:"page_size"`
	Search          string `json:"search"`
	CategoryID      int    `json:"category_id"`
	StatusAttending string `json:"status_attending"`
	StatusSent      string `json:"status_sent"`
	IsCheckedIn     *bool  `json:"is_checked_in"`
	SortBy          string `json:"sort_by"`
	SortDir         string `json:"sort_dir"`
}

type GuestListResponse struct {
	Items      []GuestResponse `json:"items"`
	Total      int64           `json:"total"`
	Page       int             `json:"page"`
	PageSize   int             `json:"page_size"`
	TotalPages int             `json:"total_pages"`
}

type GuestImportRow struct {
	GuestCategoryID   int      `json:"guest_category_id"`
	CategoryName      string   `json:"category_name"`
	Name              string   `json:"name"`
	PhoneNumber       *string  `json:"phone_number"`
	InstagramUsername *string  `json:"instagram_username"`
	Address           *string  `json:"address"`
	Note              *string  `json:"note"`
	IsValid           bool     `json:"is_valid"`
	Errors            []string `json:"errors"`
}

type GuestImportPreviewResponse struct {
	Items      []GuestImportRow `json:"items"`
	Total      int              `json:"total"`
	ValidCount int              `json:"valid_count"`
	ErrorCount int              `json:"error_count"`
}
