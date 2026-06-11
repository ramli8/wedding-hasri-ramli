package kondangan

import "time"

type CreateKondanganRequest struct {
	CoupleName string   `json:"couple_name" validate:"required,min=2,max=255"`
	RelationID int      `json:"relation_id" validate:"required"`
	Side       string   `json:"side" validate:"required,oneof=Pria Wanita"`
	GiftType   string   `json:"gift_type" validate:"required,oneof=Uang Kado"`
	GiftName   *string  `json:"gift_name" validate:"omitempty,max=255"`
	Nominal    *float64 `json:"nominal" validate:"omitempty,min=0"`
}

type UpdateKondanganRequest struct {
	CoupleName string   `json:"couple_name" validate:"omitempty,min=2,max=255"`
	RelationID *int     `json:"relation_id" validate:"omitempty"`
	Side       string   `json:"side" validate:"omitempty,oneof=Pria Wanita"`
	GiftType   string   `json:"gift_type" validate:"omitempty,oneof=Uang Kado"`
	GiftName   *string  `json:"gift_name" validate:"omitempty,max=255"`
	Nominal    *float64 `json:"nominal" validate:"omitempty,min=0"`
}

type KondanganResponse struct {
	ID         string    `json:"id"`
	CoupleName string    `json:"couple_name"`
	RelationID int       `json:"relation_id"`
	Relation   string    `json:"relation"`
	Side       string    `json:"side"`
	GiftType   string    `json:"gift_type"`
	GiftName   *string   `json:"gift_name"`
	Nominal    *float64  `json:"nominal"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

type KondanganListRequest struct {
	Page       int    `json:"page"`
	PageSize   int    `json:"page_size"`
	Search     string `json:"search"`
	RelationID int    `json:"relation_id"`
	Side       string `json:"side"`
	SortBy     string `json:"sort_by"`
	SortDir    string `json:"sort_dir"`
}

type KondanganListResponse struct {
	Items      []KondanganResponse `json:"items"`
	Total      int64               `json:"total"`
	Page       int                 `json:"page"`
	PageSize   int                 `json:"page_size"`
	TotalPages int                 `json:"total_pages"`
}

type KondanganStatsResponse struct {
	TotalKondangan   int64    `json:"total_kondangan"`
	TotalUang        int64    `json:"total_uang"`
	TotalKado        int64    `json:"total_kado"`
	TotalPengeluaran float64  `json:"total_pengeluaran"`
	RataRata         float64  `json:"rata_rata"`
	MaxUang          float64  `json:"max_uang"`
	MaxKado          float64  `json:"max_kado"`
}

type CreateKondanganRelationRequest struct {
	Name string `json:"name" validate:"required,min=2,max=100"`
}

type KondanganRelationResponse struct {
	ID        int       `json:"id"`
	Name      string    `json:"name"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
