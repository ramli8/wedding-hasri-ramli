package vendor

import "time"

// --- Category DTOs ---

type CreateCategoryRequest struct {
	EventID string `json:"event_id" validate:"required,uuid"`
	Name    string `json:"name" validate:"required,min=2,max=100"`
}

type UpdateCategoryRequest struct {
	Name string `json:"name" validate:"omitempty,min=2,max=100"`
}

type CategoryResponse struct {
	ID               int              `json:"id"`
	EventID          string           `json:"event_id"`
	Name             string           `json:"name"`
	SelectedVendorID *string          `json:"selected_vendor_id"`
	Attributes       []AttributeResponse `json:"attributes,omitempty"`
	Vendors          []VendorResponse    `json:"vendors,omitempty"`
	CreatedAt        time.Time        `json:"created_at"`
	UpdatedAt        time.Time        `json:"updated_at"`
}

type CategoryListResponse struct {
	Items      []CategoryResponse `json:"items"`
	Total      int64              `json:"total"`
	Page       int                `json:"page"`
	PageSize   int                `json:"page_size"`
	TotalPages int                `json:"total_pages"`
}

// --- Attribute DTOs ---

type CreateAttributeRequest struct {
	Name      string `json:"name" validate:"required,min=1,max=100"`
	SortOrder int    `json:"sort_order"`
}

type UpdateAttributeRequest struct {
	Name      string `json:"name" validate:"omitempty,min=1,max=100"`
	SortOrder *int   `json:"sort_order"`
}

type AttributeResponse struct {
	ID        int       `json:"id"`
	CategoryID int      `json:"category_id"`
	Name      string    `json:"name"`
	SortOrder int       `json:"sort_order"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// --- Vendor DTOs ---

type CreateVendorRequest struct {
	Name           string   `json:"name" validate:"required,min=1,max=255"`
	ContactPerson  *string  `json:"contact_person"`
	PhoneNumber    *string  `json:"phone_number"`
	Instagram      *string  `json:"instagram"`
	Address        *string  `json:"address"`
	ReferencePrice *float64 `json:"reference_price"`
	ContractAmount *float64 `json:"contract_amount"`
	PaymentStatus  string   `json:"payment_status"`
	Note           *string  `json:"note"`
	AttributeValues map[int]*string `json:"attribute_values"` // attributeId -> value
}

type UpdateVendorRequest struct {
	Name           *string  `json:"name"`
	ContactPerson  *string  `json:"contact_person"`
	PhoneNumber    *string  `json:"phone_number"`
	Instagram      *string  `json:"instagram"`
	Address        *string  `json:"address"`
	ReferencePrice *float64 `json:"reference_price"`
	ContractAmount *float64 `json:"contract_amount"`
	PaymentStatus  *string  `json:"payment_status"`
	Note           *string  `json:"note"`
}

type VendorResponse struct {
	ID             string                `json:"id"`
	CategoryID     int                   `json:"category_id"`
	Name           string                `json:"name"`
	ContactPerson  *string               `json:"contact_person"`
	PhoneNumber    *string               `json:"phone_number"`
	Instagram      *string               `json:"instagram"`
	Address        *string               `json:"address"`
	ReferencePrice *float64              `json:"reference_price"`
	ContractAmount *float64              `json:"contract_amount"`
	PaymentStatus  string                `json:"payment_status"`
	Note           *string               `json:"note"`
	AttributeValues []AttributeValueResponse `json:"attribute_values,omitempty"`
	Payments       []PaymentResponse     `json:"payments,omitempty"`
	CreatedAt      time.Time             `json:"created_at"`
	UpdatedAt      time.Time             `json:"updated_at"`
}

// --- Attribute Value DTOs ---

type UpdateAttributeValuesRequest struct {
	Values map[int]*string `json:"values" validate:"required"` // attributeId -> value
}

type AttributeValueResponse struct {
	ID          int    `json:"id"`
	VendorID    string `json:"vendor_id"`
	AttributeID int    `json:"attribute_id"`
	Value       *string `json:"value"`
}

// --- Payment DTOs ---

type CreatePaymentRequest struct {
	Date   string   `json:"date" validate:"required"`
	Amount float64  `json:"amount" validate:"required,gt=0"`
	Note   *string  `json:"note"`
}

type UpdatePaymentRequest struct {
	Date   string   `json:"date"`
	Amount *float64 `json:"amount"`
	Note   *string  `json:"note"`
}

type PaymentResponse struct {
	ID        int       `json:"id"`
	VendorID  string    `json:"vendor_id"`
	Date      string    `json:"date"`
	Amount    float64   `json:"amount"`
	Note      *string   `json:"note"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// --- Select/Deselect DTOs ---

type OverviewResponse struct {
	Categories []CategoryResponse `json:"categories"`
}

type SelectVendorResponse struct {
	CategoryID       int     `json:"category_id"`
	SelectedVendorID *string `json:"selected_vendor_id"`
}
